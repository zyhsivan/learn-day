import React, {useEffect, useState, useRef, useCallback } from "react";
import {
    exportToCanvas,
    exportToSvg,
    exportToBlob,
    exportToClipboard,
    Excalidraw,
    useHandleLibrary,
    loadFromBlob, serializeAsJSON
} from "@excalidraw/excalidraw";
import {
    ExcalidrawImperativeAPI,
    ExcalidrawInitialDataState,
} from "../packages/excalidraw/types";
import "./App.scss";
import "./css/Leftmenu.scss";

import {
  resolvablePromise,
  MenuItem,
  getItem,
} from "./utils";
import { ResolvablePromise } from "../packages/excalidraw/utils";
import LeftMenu from "./components/LeftMenu";
import MyExcalidraw from "./components/MyExcalidraw";
import {render} from "react-dom";
import {
  message,
  Layout,
  Row,
  Col,
  Button,
  Input,
  Space,
  Dropdown,
  MenuProps,
  Popover,
  ColorPicker,
  theme
} from "antd";
import { Header ,Footer} from "antd/es/layout/layout";
import Sider from "antd/es/layout/Sider";
import { Content } from "antd/lib/layout/layout";
import { PlusOutlined, MinusOutlined, MoreOutlined } from "@ant-design/icons";
import { Color } from "antd/es/color-picker";
import { APP_WEB } from "./electron_interactive";

let fs:any = null;
let ipcRenderer:any =null;
if(!APP_WEB){
  fs = window.require("fs")
  ipcRenderer = window.require("electron").ipcRenderer;
}


let currentSelectNode:any = null;
let mapMenuKey_ExcalidrawState:any = [];
let excalidrawRef:MyExcalidraw;

export default function App() {
  const appRef = useRef<any>(null);
  const leftMenuRef = useRef<any>(null);

  // const [excalidrawRef,setExcalidrawRef] = useState(null);
  // const [leftMenuRef,setLeftMenuRef] = useState(null);
  const [title, setTitle] = useState('Page名称')
  const { token } = theme.useToken();

  //工具栏菜单
  const ARRAY_TOOLS_INIT = [
    {
      id: 'selection',
      imageName: '../public/imgs/tool_selection.png',
      title: 'Section',
      isActive: false
    },
    {
      id: 'template',
      imageName: '../public/imgs/tool_template.png',
      title: 'Template',
      isActive: false
    },
    {
      id: 'text',
      imageName: '../public/imgs/tool_text.png',
      title: 'Text',
      isActive: false
    },
    {
      id: 'image',
      imageName: '../public/imgs/tool_image.png',
      title: 'Image',
      isActive: false
    },
    {
      id: 'element',
      imageName: '../public/imgs/tool_element.png',
      title: 'Element',
      isActive: false
    },
    {
      id: 'freedraw',
      imageName: '../public/imgs/tool_draw.png',
      title: 'Draw',
      isActive: false
    },
    {
      id: 'linkRegion',
      imageName: '../public/imgs/tool_link_region.png',
      title: 'Link region',
      isActive: false
    },
    {
      id: 'embeddable',
      imageName: '../public/imgs/tool_embed.png',
      title: 'Embed',
      isActive: false
    },
    {
      id: 'frame',
      imageName: '../public/imgs/tool_frame.png',
      title: 'Section',
      isActive: false
    }
  ]

  //更多菜单
  const MENU_MORE:MenuItem[] = [
    getItem('新建项目', 'newCanvas', null, undefined,undefined,()=>{
      leftMenuRef.current.newProject();
      excalidrawRef.newProject();
    }),
    getItem('导入', 'import', null, [
      getItem('导入pcanvas', 'import-pcanvas', null, undefined,undefined,()=>{
        onMoreMenuEvent("import-pcanvas")
      }),
      getItem('导入pcanvasx', 'import-pcanvasx', null, undefined,undefined,()=>{
        onMoreMenuEvent("import-pcanvasx")
      }),
    ],undefined,()=>{

    }),
  ]
  //分享菜单
  const SHARE_MENU: MenuItem[] = [
    getItem('导出为pcanvas', 'exportCanvas', null, undefined,undefined,()=>{
      onShareMenuEvent("exportCanvas")
    }),
    getItem('导出为pcanvasx', 'exportCanvasx', null, undefined,undefined,()=>{
      onShareMenuEvent("exportCanvasx")
    }),
    getItem('导出为png', 'exportPng', null, undefined,undefined,()=>{
      onShareMenuEvent("exportPng")
    }),
  ];
  const [toolButtons, setToolButtons] = useState(ARRAY_TOOLS_INIT);
  const [zoom,setZoom] = useState('100%');
  const [elementPopoverOpen,setElementPopoverOpen] = useState(false);
  const [isCanvasBackgroundOpen,setIsCanvasBackgroundOpen] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState<Color | string>(token.colorPrimary);

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise = resolvablePromise();
  }

  //画布更改
  const onCanvasChange = (elemnts:any,state:any)=>{
    var zoomValue = parseInt(state.zoom.value*100+'',10);
    setZoom(zoomValue + "%");
  }

  //画布组件--callback真NM难写。。。。。
  const onRefExcalidraw = (ref:any) => {
    // setExcalidrawRef(ref);
    excalidrawRef = ref;
  }


  useEffect(() => {
    /*
    const fetchData = async () => {
        const res = await fetch("/rocket.jpeg");
        const imageData = await res.blob();
        const reader = new FileReader();
        reader.readAsDataURL(imageData);

        reader.onload = function () {
            const imagesArray: BinaryFileData[] = [
                {
                    id: "rocket" as BinaryFileData["id"],
                    dataURL: reader.result as BinaryFileData["dataURL"],
                    mimeType: MIME_TYPES.jpg,
                    created: 1644915140367,
                    lastRetrieved: 1644915140367
                }
            ];

            //@ts-ignore
            initialStatePromiseRef.current.promise.resolve(initialData);
            excalidrawAPI.addFiles(imagesArray);
        };
    };
    fetchData();
     */

    if(ipcRenderer != null){
      ipcRenderer.on("save-canvas", (e: object, path: string) => {
        onSaveCanvasX(path);
      });

      ipcRenderer.on("open-canvas", (e: object, path: string) => {
        onReadCanvasX(path);
      })
    }
  }, []);

  /**
   * 导入
   * @param item
   */
  const onMoreMenuEvent = (item:any)=>{
    if ('import-pcanvas' == item){
      ipcRenderer.send('openFile',[{name: 'Canvas', extensions: ['pcanvas']}]);
      ipcRenderer.once("openFileResult",(event:any,args:any)=>{
        onReadCanvasX(args);
      })
    }else if ('import-pcanvasx' == item){
      ipcRenderer.send('openFile',[{name: 'Canvas', extensions: ['pcanvasx']}]);
      ipcRenderer.once("openFileResult",(event:any,args:any)=>{
        onReadCanvasX(args);
      })
    }
  }

  /**
   * 分享的导出菜单
   * @param item
   */
  const onShareMenuEvent = (item:any)=>{
    if('exportCanvas' == item){
      ipcRenderer.send('saveFile',[{name: 'Canvas', extensions: ['pcanvas']}]);
      ipcRenderer.once("saveFileResult",(event:any,args:any)=>{
        onSaveCanvasX(args);
      })
    }else if ('exportCanvasx' == item){
      ipcRenderer.send('saveFile',[{name: 'Canvas', extensions: ['pcanvasx']}]);
      ipcRenderer.once("saveFileResult",(event:any,args:any)=>{
        onSaveCanvasX(args);
      })
    }else if ('exportPng' == item){
      ipcRenderer.send('saveFile',[{name: 'Canvas', extensions: ['png']}]);
      ipcRenderer.once("saveFileResult",(event:any,args:any)=>{
        onSaveCanvasPng(args);
      })
    }
  }

  /**
   * 保存数据
   * @param szFilePath
   */
  const onSaveCanvasX = async (szFilePath: string) => {
    //更新当前画布的数据....
    if (currentSelectNode != null) {
      currentSelectNode.drawJson = getExcalidrawJson();
      //更新那个对象...
      leftMenuRef.current.updateMenuData(currentSelectNode.key, currentSelectNode.drawJson);
    }

    const jsonResult = leftMenuRef.current.getAllMenuData();
    recursionMenuData(jsonResult);
    const szJson = JSON.stringify(jsonResult);
    // let buf = new Buffer(szJson);
    fs.writeFile(szFilePath, szJson, () => {

    })
  }

  /**
   * 保存png
   * @param szFilePath
   */
  const onSaveCanvasPng = async (szFilePath:string)=>{
    // excalidrawRef.snapCapture(szFilePath);
    const imgBlob = await excalidrawRef.getPngData();
    //xian qi piao piao的使用...
    let reader = new FileReader();
    reader.readAsArrayBuffer(imgBlob);
    reader.onload = () => {
      // @ts-ignore
      let buf = new Buffer(reader.result);
      fs.writeFile(szFilePath, buf, (err:any) => {

      })
    }
  }

  /**
   * 读取数据
   * @param szFilePath
   */
  const onReadCanvasX = async (szFilePath: string) => {
    fs.readFile(szFilePath, "utf-8", (err: object, data: object) => {
      if (err) throw err;
      const jsonObj = JSON.parse(data.toString());
      leftMenuRef.current.setOutMenuData(jsonObj);
      //是否只读
      excalidrawRef.onSetReadonlyStatus(szFilePath.endsWith('pcanvas'));
    });
  }


  function recursionMenuData(jsonResult:any) {
    for (var i = 0; i < jsonResult.length; i++) {
      var item = jsonResult[i];
      item.icon = "";
      if (item.isFolder) {
        recursionMenuData(item.children);
      }
    }
  }

  function setFirstItem(selectNode:any) {
    currentSelectNode = selectNode;
  }

  /**
   * 菜单点击
   * @param mSelectNode
   */
  function leftMenuItemClicked(selectNode:any, menuNewData:any) {
    //保存上一个画布的数据.
    if (currentSelectNode != null) {
      currentSelectNode.drawJson = getExcalidrawJson();
      mapMenuKey_ExcalidrawState[currentSelectNode.key] = getExcalidrawState();
      //更新那个对象...
      leftMenuRef.current.updateMenuData(currentSelectNode.key, currentSelectNode.drawJson, menuNewData);
    }
    currentSelectNode = (selectNode);
    excalidrawRef.setDrawJson(selectNode.drawJson, mapMenuKey_ExcalidrawState[selectNode.key]);

    excalidrawRef.onAutoFocus();
  }

  /**
   * 获取当前--上一次的绘制对象....
   */
  function getExcalidrawJson() {
    if (excalidrawRef != null) {
      return excalidrawRef.getDrawJson();
    } else {
      message.error('excalidrawRef is null');
    }
  }

  function getExcalidrawState() {
    if (excalidrawRef != null) {
      return Object.assign({}, excalidrawRef.getExcalidrawState());
    } else {
      message.error('excalidrawRef is null');
    }
  }

  /**动态组件部分暂不用**/
  function createDynamicComponent(componentName:any) {
    const DynamicComponent = () => (
      <>
        {React.createElement(componentName)}
      </>
    );
    return DynamicComponent;
  }

  //显示激活的画布---
  //react 不支持状态保存。。。没必要这种搞了。。。。
  function ShowActivieDraw() {
    let Excalidraw = null;
    if (currentSelectNode != null) {
      Excalidraw = currentSelectNode.excalidraw;
    } else {
      Excalidraw = createDynamicComponent(MyExcalidraw);
    }
    return (
      <>
        <Excalidraw />
      </>
    )
  }

  /**动态组件部分暂不用--end**/

  let drawJson = [];
  if (currentSelectNode != null) {
    drawJson = currentSelectNode.drawJson;
  }

  //工具栏点击
  const toolsClicked = (e:any) => {
    var szId = e.currentTarget.dataset.id;
    var arrayNew = [...toolButtons];
    arrayNew.forEach(p => {
      if (szId == p.id && 'image' != szId) {
        p.isActive = true;
      } else {
        p.isActive = false;
      }
    });
    setToolButtons(arrayNew);
    if('element' == szId){
      setElementPopoverOpen(true);
    }else{
      excalidrawRef.onSetActiveTool(szId);
    }
  }

  function onElementClickEvent(e:any){
    var szId = e.currentTarget.dataset.id;
    setElementPopoverOpen(false)
    excalidrawRef.onSetActiveTool(szId);
  }

  //渲染elemnt工具栏
  function renderToolElement(){
    const arrayItems = [
      {
        id: 'rectangle',
        imageName: '../public/imgs/tool_element_rect.png',
        title: 'Rectangle',
        isActive: false
      },
      {
        id: 'diamond',
        imageName: '../public/imgs/tool_element_diamond.png',
        title: 'Diamond',
        isActive: false
      },
      {
        id: 'ellipse',
        imageName: '../public/imgs/tool_element_elpsic.png',
        title: 'Ellipse',
        isActive: false
      },
      {
        id: 'arrow',
        imageName: '../public/imgs/tool_element_arrow_right.png',
        title: 'Arrow',
        isActive: false
      },
      {
        id: 'line',
        imageName: '../public/imgs/tool_element_line.png',
        title: 'Line',
        isActive: false
      }
    ];
    var arrayHtmls = [];
    for(var i=0;i<arrayItems.length;i++){
      var item = arrayItems[i];
      arrayHtmls.push(
        <div data-id={item.id} onClick={(e)=>onElementClickEvent(e)}><img src={item.imageName}/><span>{item.title}</span></div>
      )
    }

    return (
      <>
        <div className='tool-element-item'>
          {arrayHtmls}
        </div>
      </>
    )
  }

  //渲染工具栏
  function renderToolButtons() {
    var arrayNew = [];
    for(var i=0;i<toolButtons.length;i++){
      var p = toolButtons[i];
      if(p.id == 'element'){
        arrayNew.push(
          <Popover
            style={{margin:'0px',padding:'0px'}}
            content={renderToolElement()}
            title=""
            trigger="click"
            onOpenChange={(e)=>setElementPopoverOpen(e)}
            open={elementPopoverOpen}>
            <Button key={p.id} data-id={p.id} type='text'
                    style={{margin:'0 6px',padding:'6px'}}
                    className={p.isActive ? 'tool-button-active' : 'tool-button'}
                    onClick={toolsClicked}>
              <img className='img-small' src={p.imageName} />
              <span>{p.title}</span>
            </Button>
          </Popover>

        )
      }else{
        arrayNew.push(<Button key={p.id} data-id={p.id} type='text'
                              style={{margin:'0 6px',padding:'6px'}}
                              className={p.isActive ? 'tool-button-active' : 'tool-button'}
                              onClick={toolsClicked}>
          <img className='img-small' src={p.imageName} />
          <span>{p.title}</span>
        </Button>)
      }
    }
    return (
      <>
        {
          arrayNew
        }
      </>
    )
  }

  function renderPageBackground(){
    return(
      <></>
    )
  }

  //设置背景色
  function setCanvasBackgroundColor(value:any,hex:string){
    excalidrawRef?.onSetBackground(hex);
  }

  //undo
  function undo(){
    document.getElementById("undo")?.click();
  }
  //redo
  function redo(){
    document.getElementById("redo")?.click();
  }

  return (
    <div className="App" ref={appRef}>
      <Layout className='layoutStyle'>
        <Header className='headerStyle'>
          <div className='headerStyle-content'>
            <div className='headerStyle-content-lr'>
              <img className='img-small' src={'../public/imgs/home.png'} />
              <Dropdown menu={{items:MENU_MORE}} trigger={['click']}>
                <img className='img-small' src={'../public/imgs/menu.png'} style={{ marginLeft: '16px' }} />
              </Dropdown>

              <Input bordered={false} style={{ marginLeft: '16px', width: 'auto' }} value={title} onChange={(e) => {
                setTitle(e.target.value)
              }} />
            </div>
            {/*工具栏*/}
            <div className='headerStyle-content-tool'>
              {renderToolButtons()}
            </div>
            <div className='headerStyle-content-lr'>
              <Button className='padding-bottom-0'>
                <img className='img-button-small' src={'../public/imgs/canvas_save.png'} />
              </Button>
              <Button className='ml-16 padding-bottom-0'>
                <img className='img-button-small' src={'../public/imgs/canvas_preview.png'} />
              </Button>
              <Dropdown menu={{ items:SHARE_MENU }} trigger={['click']}>
                <Button className='ml-16 padding-bottom-0' type="primary">
                  <img className='img-button-small' src={'../public/imgs/canvas_share.png'} />
                </Button>
              </Dropdown>
            </div>
          </div>
        </Header>
        <Layout>


          <Layout>
            <Content className='contentStyle'>
              <div className="excalidraw-wrapper">
                <MyExcalidraw value={drawJson} onRef={onRefExcalidraw} parentOnCanvasChange={onCanvasChange}/>
              </div>

              <div className='footerStyle-tool'>
                <ColorPicker value={backgroundColor} onChange={setCanvasBackgroundColor}>
                  <div className='footerStyle-tool-item ml-16'>
                    <img src={'../public/imgs/page_color.png'} />
                    <span>Page color</span>
                  </div>
                </ColorPicker>

                <div className='footerStyle-tool-item ml-16'>
                  <img src={'../public/imgs/undo.png'} onClick={undo}/>
                  <img style={{marginLeft:'12px'}} src={'../public/imgs/redo.png'} onClick={redo}/>
                </div>

                {/*缩放*/}
                <div className='footerStyle-tool-item-0 ml-16'>
                  <Button className='small-button' style={{padding:'0px',margin:'0px'}} type={"text"} icon={<MinusOutlined rev={undefined} />} />
                  <Input bordered={false} readOnly={true}
                         style={{ width: '40px',height:'16px', border: '0px', padding: '0px', margin: '0px', textAlign: 'center' }}
                         value={zoom}></Input>
                  <Button className='small-button' type={"text"} icon={<PlusOutlined rev={undefined} />} />
                </div>
              </div>
            </Content>

          </Layout>
        </Layout>
      </Layout>
    </div>
  );
}
















