import React, {useState,useImperativeHandle} from "react";
import {AppClassProperties, DataURL, ExcalidrawImperativeAPI, Gesture} from "../../packages/excalidraw/types";

//这些玩意，怎么引入。
import {Image} from "antd";
import {
  MainMenu,
  Excalidraw,
  loadFromBlob,
  exportToClipboard,
  serializeAsJSON,
  exportToBlob
} from "../../packages/excalidraw";
import html2canvas from "html2canvas";
import { APP_WEB } from "../electron_interactive";
let fs:any = null;
let ipcRenderer:any = null;
if(!APP_WEB){
  fs = window.require("fs");
  ipcRenderer = window.require("electron").ipcRenderer;
}

const GRID_SIZE_CUSTOM = 25;

interface AppProps {
    //code related to your props goes here
    value: any,
    onRef:any,
    parentOnCanvasChange:any
}

interface AppState {
    isImagePreviewVisible:any,
    imagePreviewData:any,
    excalidrawAutofocus:boolean,
  isReadOnlyStatus:boolean,
  isShowGridMode:boolean
}
let excalidrawAPI:ExcalidrawImperativeAPI;
let lastTime:any = 0;
// let visible = false;
// gridSize:GRID_SIZE_CUSTOM,
//   viewMode:true
const excalidrawInitData = {
    elements:[],
    appState:{
        currentItemStrokeWidth:1,
        currentItemRoughness:0,
      viewBackgroundColor: '#ffffff'
    },
    scrollToContent:false,
    libraryItems:[]
}

export default class MyExcalidraw extends React.Component<AppProps, AppState>{
    constructor(AppProps:any) {
        super(AppProps);
        this.state = {
            isImagePreviewVisible:false,
            imagePreviewData:null,
            excalidrawAutofocus:true,
          isReadOnlyStatus:false,
          isShowGridMode:true
        }
    }

    componentDidUpdate(prevProps: Readonly<AppProps>, prevState: Readonly<AppState>, snapshot?: any) {

    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    }

    componentDidMount() {
        this.props.onRef && this.props.onRef(this);
        this.onInitData();
    }

    componentWillUnmount() {

    }

    //获取焦点。。。。HOW
    onAutoFocus = ()=>{

    }

    newProject = () => {
      excalidrawAPI.resetScene();
      this.setState({
        isReadOnlyStatus: false,
        isShowGridMode: true
      })
      excalidrawAPI.updateScene({
        appState:{
          ...excalidrawAPI.getAppState(),
          gridSize: null
        }
      })
    }

    onSetReadonlyStatus = (isReadOnly:boolean)=>{
      this.setState({
        isReadOnlyStatus:isReadOnly
      })
    }

    onSetActiveTool = (type:any)=>{
      excalidrawAPI.getApp().setActiveTool(
        {
          type: type,
          insertOnCanvasDirectly: false,
        }
      )
    }

  /**
   * 设置背景色
   * @param szHexColor
   */
  onSetBackground = (szHexColor:string)=>{
      const appState = excalidrawAPI.getAppState();
      excalidrawAPI.updateScene({
        appState:{
          ...appState,
          viewBackgroundColor:szHexColor
        }
      })
    }

    onUndo = ()=>{

    }

    onRedo = ()=>{

    }

    onInitData = function (){
      if(ipcRenderer != null){
        ipcRenderer.on("new-canvas",(e:object,arg:object)=>{
          if (!excalidrawAPI){
            return;
          }
          excalidrawAPI.resetScene();
        });
      }
        // useHandleLibrary(this.state.excalidrawAPI)
    }

    // onPointerDown = (activityTool:any,pointerDownState:any)=>{
    //   // return
    //     // console.log(activityTool);
    //     if(pointerDownState.hit.element != null ){
    //         var ele = pointerDownState.hit.element;
    //         if(ele.type == 'image'){
    //           var files = excalidrawAPI.getFiles();
    //           var item = files[ele.fileId];

    //           if(this.state.isReadOnlyStatus){
    //             if(ele.link == undefined){
    //               if(item != null){
    //                 this.setState({
    //                   isImagePreviewVisible:true,
    //                   imagePreviewData:item.dataURL
    //                 })
    //               }
    //             }else{
    //               if(ipcRenderer != null){
    //                 ipcRenderer.send("open-url",ele.link);
    //               }
    //             }
    //           }else{
    //             const nowTime = new Date().getTime();
    //             if(nowTime - lastTime < 300){
    //               if(item != null){
    //                 this.setState({
    //                   isImagePreviewVisible:true,
    //                   imagePreviewData:item.dataURL
    //                 })
    //               }
    //             }
    //           }
    //         }
    //     }
    //     lastTime = new Date().getTime();
    // }

    onPointerDown = (activityTool: any, pointerDownState: { hit: { element: any; }; }) => {
      const imageElement = pointerDownState.hit.element;
      if (!imageElement || imageElement.type !== 'image') return;
      const files = excalidrawAPI.getFiles();
      const imageFile = files[imageElement.fileId];
      if (!imageFile) return;

      // 仅在只读状态下处理点击事件
      if (this.state.isReadOnlyStatus) {
        if (imageElement.link) {
          ipcRenderer.send("open-url", imageElement.link);
        }
      }
    };


    onCopy = async (type: "png" | "svg" | "json") => {
        if (!excalidrawAPI) {
            return false;
        }
        await exportToClipboard({
            elements: excalidrawAPI.getSceneElements(),
            appState: excalidrawAPI.getAppState(),
            files: excalidrawAPI.getFiles(),
            type
        });
        window.alert(`Copied to clipboard as ${type} successfully`);
    };

  /**
   * 获取png
   */
  getPngData = async ()=>{
      const elements = excalidrawAPI.getSceneElements();
      const pngData = await exportToBlob({
        elements,
        mimeType:"image/png",
        appState:{
          exportWithDarkMode:false,
        },
        files:excalidrawAPI.getFiles(),
        quality:1
      })
      return pngData;
    }

  /**
   * 保存截图
   * @param szSavePath
   */
  snapCapture = (szSavePath:any)=> {
    html2canvas(document.getElementById("canvas") as HTMLElement,{
      allowTaint:true,
      width:800,
      height:800,
      scale:window.devicePixelRatio,
    }).then(canvas=>{
      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgBlob = this.dataURIToBlob(imgData);
      let reader = new FileReader();
      reader.readAsArrayBuffer(imgBlob);
      reader.onload = () => {
        // @ts-ignore
        let buf = new Buffer(reader.result);
        if(fs != null){
          fs.writeFile(szSavePath, buf, (err:any) => {

          })
        }
      }
    })
  }

    /**
     * 转blob
     * @param dataURI
     * @returns {*}
     */
    dataURIToBlob = (dataURI:any)=>{
      var byteString = atob(dataURI.split(',')[1]);
      var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
      var ab = new ArrayBuffer(byteString.length);
      var ia = new Uint8Array(ab);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], {type: mimeString});
    }

    /**
     * 获取本画布JSON串
     */
    getDrawJson = ()=>{
        const jsonResult = serializeAsJSON(excalidrawAPI.getSceneElements(), excalidrawAPI.getAppState(),excalidrawAPI.getFiles(),"local");
        // const sb = saveAsJSON(excalidrawAPI.getSceneElements(),excalidrawAPI.getAppState(),excalidrawAPI.getFiles());
        // alert(sb)
        return JSON.parse(jsonResult);
    }

    /**
     * 获取状态
     */
    getExcalidrawState = ()=>{
        return excalidrawAPI.getAppState();
    }

    shitLoad = async (blob:Blob,appState:any)=> {
      // @ts-ignore
      var scene = await loadFromBlob(blob, (appState == null) ? excalidrawAPI.getAppState() : appState, excalidrawAPI.getSceneElements());

      if(appState != undefined){
        appState.width = excalidrawAPI.getAppState().width;
        appState.height = excalidrawAPI.getAppState().height;
      }

      scene.appState = appState;
      // @ts-ignore  IMAGE更新不出来...
      excalidrawAPI.updateScene(scene);
    }

    setDrawJson = (jsonObj:any,appState:any)=>{
        console.log("setDrawJson");
        if(jsonObj == undefined || jsonObj == null || jsonObj.length == 0){
            excalidrawAPI.resetScene();
          excalidrawAPI.updateScene({
            appState:{
              ...excalidrawAPI.getAppState(),
              gridSize: null
            }
          })
            return;
        }

        var arrayFuckEx = [];
        for(var i=0;i<jsonObj.elements.length;i++){
            var ele = jsonObj.elements[i];
            var c = jsonObj.files[ele.fileId];
            if(c != undefined && c != null){
                var item = {
                    mimeType: c.mimeType,
                    id: c.id,
                    dataURL: c.dataURL,
                    created: c.created,
                    lastRetrieved:c.lastRetrieved
                }
                arrayFuckEx.push(item);
            }
        }
        excalidrawAPI.addFiles(arrayFuckEx);
        let buf = new Buffer(JSON.stringify(jsonObj));
        const blob = new Blob([buf]);
        this.shitLoad(blob,appState);
    }

    render(){
        return(
            <>
                <Excalidraw
                    initialData={excalidrawInitData}
                    onPointerDown={this.onPointerDown}
                    viewModeEnabled={this.state.isReadOnlyStatus}
                    excalidrawAPI={(api => excalidrawAPI=api)}
                    onChange={(elements, state) => {
                         if(this.props.parentOnCanvasChange != null){
                           this.props.parentOnCanvasChange(elements, state);
                         }
                    }}
                    onLinkOpen={((element, event) => {
                        event.preventDefault();
                        //外部打开...
                        if(ipcRenderer != null){
                          ipcRenderer.send("open-url",element.link)
                        }
                    })}
                    name="Drawing"
                    autoFocus={this.state.excalidrawAutofocus}
                    UIOptions={{
                        canvasActions: { loadScene: false }
                    }}>

                    {/*{renderMenu()}*/}
                </Excalidraw>

                <Image
                    width={20}
                    style={{ display: 'none',zIndex:99 }}
                    preview={{
                        visible:this.state.isImagePreviewVisible,
                        src: this.state.imagePreviewData,
                        onVisibleChange: (value) => {
                            this.setState({
                                isImagePreviewVisible:value
                            });
                        },
                    }}
                />
            </>
        );
    }
}
