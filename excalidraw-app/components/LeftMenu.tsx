import React, {RefAttributes, useEffect, useState,forwardRef,useImperativeHandle} from "react";
import {
    Button,
    Flex,
    message,
    Tree,
    Modal,
    Input,
    ConfigProvider,
    Space,
    Menu,
    MenuProps,
    Popover,
    Dropdown
} from "antd";
import { DownOutlined,PlusOutlined,FolderOutlined,SearchOutlined,MoreOutlined,GatewayOutlined,CaretDownOutlined } from '@ant-design/icons';
import type { TreeProps } from 'antd/es/tree';
import {FieldDataNode} from "rc-tree/lib/interface"
import {generateUUID2,MenuItem,getItem} from "../utils";
import MyExcalidraw from "./MyExcalidraw";
import {nanoid} from "nanoid";
// import {menu} from "@excalidraw/excalidraw/types/components/icons";

const {DirectoryTree} = Tree;

// type MenuItem = Required<MenuProps>["items"][number];

type DataNode = FieldDataNode<{
    key:string;
    title?:string;
    editValue?:string;
    isEditable?:boolean;
    isFolder:boolean;
    drawJson:any;
    children?:any;
    icon:any;
    isSelected?:boolean;
    isHover?:boolean;
}>

let mSelectNode:any;
let mIsAddFolder:boolean = false;
let lastClickTime:any;
let mszMessageBoxAction:string;
let arrayMenuDataLastest:any=[];//最新的菜单。。。。

// function getItem(
//     label: React.ReactNode,
//     key?: React.Key | null,
//     icon?: React.ReactNode,
//     children?: MenuItem[],
//     type?: 'group',
//     onClick?:any
// ): MenuItem {
//     return {
//         key,
//         icon,
//         children,
//         label,
//         type,
//         onClick
//     } as MenuItem;
// }


const LeftMenu = forwardRef(function _LeftMenu(props:{leftMenuItemClicked:any,setFirstItem:any,getCurrentDrawJson:any},ref){
    useImperativeHandle(ref,()=>({
        updateMenuData:updateMenuData,
        getAllMenuData:getAllMenuData,
        setOutMenuData:setOutMenuData,
        newProject:newProject
    }));

    const items: MenuItem[] = [
        getItem('创建副本', 'copy', null, undefined,undefined,()=>{
            onMenuItemContextMenu("copy")
        }),
        getItem('重命名', 'rename', null, undefined,undefined,()=>{
            onMenuItemContextMenu("rename")
        }),
        getItem('删除', 'delete', null, undefined,undefined,()=>{
            onMenuItemContextMenu("delete")
        }),
    ];

    const defaultItem:DataNode = {
        title:'默认画布',
        key:nanoid(),
        icon:<GatewayOutlined rev={undefined}/>,
        isFolder:false,
        drawJson:[]
    }
    const [menuData,setMenuData] = useState<DataNode[]>([defaultItem])
    const [expandKeys,setExpandKeys] = useState([]);
    const [treeSelectedKeys,setTreeSelectedKeys] = useState([defaultItem.key]);
    const [isMessageBoxShow,setIsMessageBoxShow] = useState(false);
    const [isTreeItemHoverPopupVisible,setIsTreeItemHoverPopupVisible] = useState(false);
    const [inputPlaceHolder,setInputPlaceHolder] = useState('新建画布');
    const [inputCanvasName,setInputCanvasName] = useState('');
    const [treeDraggable,setTreeDraggable] = useState(true);

    useEffect(()=>{
        props.setFirstItem(defaultItem);
    },[])

    //更新本菜单下的drawjson
    function updateMenuData(key:any,drawJson:any,menuNewData:any){
        var menuDataNew = [];
        if(menuNewData != undefined && menuNewData != null){
            menuDataNew.push(...menuNewData);
        }else{
            menuDataNew.push(...menuData);
        }
        recursionUpdate(menuDataNew,key,drawJson);
        setMenuData(menuDataNew);
    }

    //获取菜单
    function getAllMenuData(){
        return menuData;
    }

    function newProject(){
      defaultItem.key = nanoid();
      setMenuData([defaultItem]);
      setTreeSelectedKeys([defaultItem.key])
      props.setFirstItem(defaultItem);
    }

    //设置外部读取的数据--
    function setOutMenuData(menuNewData:any){
        recursionUpdateOutMenuData(menuNewData);
        setMenuData(menuNewData);
        //显示第一条数据
        const firstNode = getFirstCanvasNode(menuNewData);
        setTreeSelectedKeys([firstNode.key]);
        props.setFirstItem(null);
        props.leftMenuItemClicked(firstNode);
    }

    //第一个画布...
    function getFirstCanvasNode(arrayMenuDatas:any){
        for(var i=0;i<arrayMenuDatas.length;i++){
            var item = arrayMenuDatas[i];
            if(item.isFolder){
                getFirstCanvasNode(item.children);
            }else{
                return item;
            }
        }
    }

    //递归更新....
    function recursionUpdateOutMenuData(menuData:any){
        for(var i=0;i<menuData.length;i++){
            var item = menuData[i];
            if(item.isFolder){
                item.icon = <FolderOutlined rev={undefined}/>;
                recursionUpdateOutMenuData(item.children);
            }else{
                item.icon = <GatewayOutlined rev={undefined}/>;
                // item.drawJson = JSON.parse(item.drawJson);
            }
        }
    }

    //找当前的KEY所有的条目，并更新...
    function recursionUpdate(menuDataNew:any,key:any,drawJson:any){
        for(var i=0;i<menuDataNew.length;i++){
            var item = menuDataNew[i];
            if(item.isFolder){
                recursionUpdate(item.children,key,drawJson);
            }else{
                if(item.key == key){
                    item.drawJson = drawJson;
                }
            }
        }
    }


    const canvaItemSelect =(menuNewData:any)=>{
        if(mSelectNode.isFolder){

        }else{
            props.leftMenuItemClicked(mSelectNode,menuNewData);
        }
    }

    /**
     * tree选择.....
     */
    const onSelect:TreeProps["onSelect"] =((selectedKeys:any, info) => {
        console.log(selectedKeys);
        console.log(info)
        var now = new Date().getTime();
        if(now - lastClickTime < 300){
            //双击
            const data = [...menuData];
            loop(data, selectedKeys[0], (item) => {
                item.isEditable = true;
                item.editValue = item.title;
            });
            setMenuData(data)
            setTreeDraggable(false);
        }else{
            if(treeSelectedKeys != null && treeSelectedKeys.length > 0 && treeSelectedKeys[0] == selectedKeys[0]){
                lastClickTime = new Date().getTime();
                return;
            }
            setTreeSelectedKeys(selectedKeys);
            mSelectNode = info.node
            //重置所有未选择
            mSelectNode.isSelected = true;
            canvaItemSelect(menuData);
        }

        lastClickTime = new Date().getTime();
    })
    const onExpand:TreeProps["onExpand"]=((expandedKeys:any, expanded) => {
        setExpandKeys(expandedKeys);
    })

    const onDrop: TreeProps['onDrop'] = (info) => {
        console.log(info);
        var isDragOk = true;
        const dropKey = info.node.key;
        const dragKey = info.dragNode.key;
        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const loop = (
            data: DataNode[],
            key: React.Key,
            callback: (node: DataNode, i: number, data: DataNode[]) => void,
        ) => {
            for (let i = 0; i < data.length; i++) {
                if (data[i].key === key) {
                    return callback(data[i], i, data);
                }
                if (data[i].children) {
                    loop(data[i].children!, key, callback);
                }
            }
        };
        const data = [...menuData];

        // Find dragObject
        let dragObj: DataNode;
        loop(data, dragKey, (item, index, arr) => {
            arr.splice(index, 1);
            dragObj = item;
        });

        if (!info.dropToGap) {
            // Drop on the content
            loop(data, dropKey, (item) => {
                if(item.children == null){//不能移到画布下。。。。
                    isDragOk = false;
                }else{
                    item.children = item.children || [];
                    // where to insert. New item was inserted to the start of the array in this example, but can be anywhere
                    item.children.unshift(dragObj);
                }
            });
        } else if (
            ((info.node as any).props.children || []).length > 0 && // Has children
            (info.node as any).props.expanded && // Is expanded
            dropPosition === 1 // On the bottom gap
        ) {
            loop(data, dropKey, (item) => {
                if(item.children == null) {//不能移到画布下。。。。
                    isDragOk = false;
                }else{
                    item.children = item.children || [];
                    // where to insert. New item was inserted to the start of the array in this example, but can be anywhere
                    item.children.unshift(dragObj);
                    // in previous version, we use item.children.push(dragObj) to insert the
                    // item to the tail of the children
                }
            });
        } else {
            let ar: DataNode[] = [];
            let i: number;
            loop(data, dropKey, (_item, index, arr) => {
                ar = arr;
                i = index;
            });
            if (dropPosition === -1) {
                ar.splice(i!, 0, dragObj!);
            } else {
                ar.splice(i! + 1, 0, dragObj!);
            }
        }
        if(isDragOk){
            setMenuData(data);
        }
    };

    const onTreeMouseEnter:TreeProps["onMouseEnter"] = (event)=>{
        console.log(event);
        var newData = [...menuData];
        resetHoverStatus(newData,event.node.key);
        setMenuData(newData);
    }

    const onTreeMouseLeave:TreeProps["onMouseLeave"] = (event)=>{
        var newData = [...menuData];
        resetHoverStatus(newData,"");
        setMenuData(newData);
        setIsTreeItemHoverPopupVisible(false)
    }

    const onAdd = (key:any) => {
        const data = [...menuData];
        loop(data, key, (item) => {
            const children = Array.isArray(item.children) ? [...item.children] : []
            children.push({
                key: nanoid(), // 这个 key 应该是唯一的
                title: "default",
                // level: item.level + 1
            })
            item.children = children
        });
        // @ts-ignore
      setExpandKeys([...expandKeys, key])
        setMenuData(data);
    };

    const onEdit = (key:any) => {
        const data = [...menuData];
        closeNode(data);
        loop(data, key, (item) => {
            item.editValue = item.title
            item.isEditable = true
        });
        setMenuData(data);

    };

    // input 改变
    const onChange = (e:any, key:any) => {
        const data = [...menuData];
        loop(data, key, (item) => {
            item.editValue = e.target.value;
            item.title = item.editValue;
        });
        setMenuData(data)
    };

    //丢失焦点
    const onBlur = (e:any,key:any)=>{
        const data = [...menuData];
        loop(data, key, (item) => {
            item.editValue = e.target.value;
            item.title = item.editValue;
            item.isEditable = false;
        });
        setMenuData(data)

        setTreeDraggable(true);
    }

    // 保存
    const onSave = (key:any) => {
        const data = [...menuData];
        loop(data, key, (item) => {
            item.isEditable = false
            item.title = item.editValue || ''
        });
        console.log(data)
        setMenuData(data);
    };

    // 关闭输入
    const onClose = (key:any) => {
        const data = [...menuData];
        loop(data, key, (item) => {
            item.editValue = item.title
            item.isEditable = false
        });
        setMenuData(data);
    };

    const closeNode = (data:any) =>
        data.forEach((item:any) => {
            item.isEditable = false;
            if (item.children) {
                closeNode(item.children);
            }
        });

    const onDelete = (key:any) => {
        const data = [...menuData];
        loop(data, key, (_, index, arr) => {
            arr.splice(index, 1);
        });
        setMenuData(data);
    };

    // 找到节点数据并回调处理节点方法 callback回调: node-当前节点 i-当前节点序号 data-包含当前节点的节点组 parentNode 当前节点父节点
    const loop = (
        data: DataNode[],
        key: React.Key,
        callback: (node: DataNode, i: number, data: DataNode[], parent?: DataNode) => void,
        parentNode?: DataNode,
    ) => {
        for (let i = 0; i < data.length; i++) {
            if (data[i].key === key) {
                return callback(data[i], i, data, parentNode);
            }
            if (data[i].children) {
                loop(data[i].children!, key, callback, data[i]);
            }
        }
    };

    /**
     * 重置状态
     * @param data
     * @param key
     */
    const resetHoverStatus = (data:any,key:any)=>{
        for (let i = 0; i < data.length; i++) {
            if (data[i].key === key) {
                data[i].isHover = true;
            }else{
                data[i].isHover = false;
            }
            if (data[i].children) {
                resetHoverStatus(data[i].children!, key);
            }
        }
    }

    //添加子画布
    const onAddItem = ()=>{
        mIsAddFolder = false;
        onAddNewCanvas("新建画布");
    }
    //添加文件夹画布
    const onAddFolder = ()=>{
        mIsAddFolder = true;
        onAddNewCanvas("新建文件夹");
    }

    //添加画布
    const onAddNewCanvas = (szInputTitle:string)=>{
        if(mIsAddFolder){
            //文件夹...
            let menuDataNew:any = [];
            const itemNew = {
                title:szInputTitle,
                editValue:szInputTitle,
                key:generateUUID2(),
                icon:<FolderOutlined rev={undefined}/>,
                isFolder:mIsAddFolder,
                isEditable:true,
                children:[]
            }
            if(mSelectNode == undefined){
              mSelectNode = menuData[0];
            }
            if(mSelectNode != null && mSelectNode.isFolder){
                mSelectNode.children.push(itemNew);
                menuDataNew.push(...menuData)
            }else{
                menuDataNew.push(...menuData)
                if(menuDataNew.length == 0){
                    menuDataNew.push(itemNew);
                }else{
                    //插入到当前选中的后面一个位置...
                    loop(menuDataNew, treeSelectedKeys[0], (_, index, arr,parent) => {
                        if(parent != undefined && parent.isFolder){
                            parent.children.splice(index+1,0,itemNew);
                        }else{
                            menuDataNew.splice(index+1,0,itemNew);
                        }
                    });
                }

            }
            setMenuData(menuDataNew);
            //选中新建
            mSelectNode = itemNew;
            setTreeSelectedKeys([itemNew.key])
            canvaItemSelect(menuDataNew);
        }else{
            //添加到子画布
            let menuDataNew:any = [];
            let expandKeysNew:any = [...expandKeys];
            const itemNew =  {
                title:szInputTitle,
                editValue:szInputTitle,
                key:generateUUID2(),
                icon:<GatewayOutlined rev={undefined}/>,
                isFolder:mIsAddFolder,
                isEditable:true,
                drawJson:[]
            };
            if(mSelectNode != null && mSelectNode.isFolder){
                mSelectNode.children.push(itemNew);
                menuDataNew.push(...menuData);
                expandKeysNew.push(mSelectNode.key);
            }else{
                menuDataNew.push(...menuData);
                if(menuDataNew.length == 0){
                    menuDataNew.push(itemNew);
                }else{
                    //插入到当前选中的后面一个位置...
                    loop(menuDataNew, treeSelectedKeys[0], (_, index, arr,parent) => {
                        if(parent != undefined && parent.isFolder){
                            parent.children.splice(index+1,0,itemNew);
                        }else{
                            menuDataNew.splice(index+1,0,itemNew);
                        }
                    });
                }
            }
            setMenuData(menuDataNew);
            setExpandKeys(expandKeysNew);
            //选中新建
            selectNewItemAndNav(itemNew,menuDataNew);
        }
    }

    //选中并转到新建的.
    const selectNewItemAndNav = (itemNew:any,arrayNewMenu:any)=>{
        mSelectNode = itemNew;
        setTreeSelectedKeys([itemNew.key])
        canvaItemSelect(arrayNewMenu);
    }

    const onClick: MenuProps['onClick'] = (e) => {
        console.log('click', e);
        setIsTreeItemHoverPopupVisible(false);
        mszMessageBoxAction = e.key;
        if("copy" == e.key){

        }else if("rename" == e.key){
            const data = [...menuData];
            loop(data, e.key, (item) => {
                item.isEditable = true;
                item.editValue = item.title;
            });
            setMenuData(data)
            setTreeDraggable(false);
        }else if("delete" == e.key){
            setIsMessageBoxShow(true);
        }
    };

    const onMenuItemContextMenu = (szAction:any)=>{
        mszMessageBoxAction = szAction;
        const data = [...menuData];
        if("copy" == szAction){
            loop(data, treeSelectedKeys[0], (item,index,type,parent) => {
                var newItem = Object.assign({},item);
                newItem.title = newItem.editValue = newItem.title+"(复制)"
                newItem.key = nanoid();
                newItem.drawJson = props.getCurrentDrawJson();
                if(parent != undefined){
                    parent.children.splice(index+1,0,newItem);
                }else{
                    data.splice(index+1,0,newItem);
                }
                //最新的。。。。。
                arrayMenuDataLastest = data;
                setMenuData(data);
                selectNewItemAndNav(newItem,data);
            });
        }else if("rename" == szAction){
            loop(data, treeSelectedKeys[0], (item) => {
                item.isEditable = true;
                item.editValue = item.title;
            });
            setMenuData(data)
            setTreeDraggable(false);
        }else if("delete" == szAction){
            setIsMessageBoxShow(true);
        }
    }

    //弹出确认框
    const onMessageBoxOk = ()=>{
        setIsMessageBoxShow(false);

        if("delete" == mszMessageBoxAction){
            //删除
            //会自动跳转到同一个层级的上一个画布
            //如果删除的是文件夹里的第一个画布（或者唯一的子画布），就自动跳转到项目的第一个画布
            var newData = [...menuData];
            var selectPreNode = null;
            loop(newData,treeSelectedKeys[0],((node, i,data,parent) => {
                if(parent != null){
                    parent.children.splice(i,1);
                    if(i < parent.children.length){
                        selectPreNode = parent.children[i];
                    }
                }else{
                    newData.splice(i,1);
                    if(i < newData.length){
                        selectPreNode = newData[i];
                    }
                }
            }))
            setMenuData(newData);
            if(selectPreNode == null){
                selectPreNode = getFirstCanvasNode(newData);
            }
            if (selectPreNode != null){
                mSelectNode = selectPreNode;
            }
            setTreeSelectedKeys([mSelectNode.key]);
            canvaItemSelect(newData);
        }
    }

    return(
        <>
            <Flex gap={"middle"} vertical>
                <Flex gap={"small"} align="center" className="left-menu-title">
                    <span>Pages</span>
                    <span style={{flexGrow:1}}></span>
                  <Button type="text" shape="circle" icon={<FolderOutlined rev={undefined}/>} onClick={onAddFolder}/>
                    <Button type="text" shape="circle" icon={<PlusOutlined rev={undefined}/>} onClick={onAddItem}/>
                </Flex>

                <ConfigProvider
                    theme={{
                        components:{
                            Tree:{
                                titleHeight:32,
                                nodeSelectedBg:"#0085FF",
                            }
                        }
                    }}
                >
                    <DirectoryTree
                        className="tree-fuck-css"
                        switcherIcon={<CaretDownOutlined rev={undefined}/>}
                        expandedKeys={expandKeys}
                        onExpand={onExpand}
                        onSelect={onSelect}
                        treeData={menuData}
                        selectedKeys={treeSelectedKeys}
                        showIcon={true}
                        blockNode={true}
                        draggable={treeDraggable}
                        onDrop={onDrop}
                        onMouseEnter={onTreeMouseEnter}
                        onMouseLeave={onTreeMouseLeave}
                        titleRender={(nodeData:DataNode)=>{
                            if(nodeData.isEditable){
                                return(
                                    <div style={{display:"flex",width:"100%",alignItems:"center"}}>
                                        <Input value={nodeData.editValue || ''}
                                               style={{color:"white",marginLeft:'0px',paddingLeft:'0px',flexGrow:1}}
                                               bordered={false}
                                               autoFocus={true}
                                               onChange={(e)=>onChange(e,nodeData.key)}
                                               onBlur={(e)=>onBlur(e,nodeData.key)}
                                        />
                                      <div style={{width:'16px',height:'16px',marginLeft:'16px'}}></div>
                                    </div>
                                )
                            }else{
                                return(
                                    <Dropdown menu={{items}} trigger={['contextMenu']} overlayStyle={{width:'auto'}}>
                                        <div style={{display:"flex",width:"100%",alignItems:"center"}}>
                                            <Input readOnly={true} bordered={false}
                                                   style={{color:(treeSelectedKeys[0]==nodeData.key)?"white":"black",marginLeft:'0px',paddingLeft:'0px',cursor:"pointer",flexGrow:1}}
                                                   value={nodeData.title}/>

                                            <Dropdown menu={{items}} trigger={['click']}>
                                                <MoreOutlined rev={undefined} style={{visibility:nodeData.isHover?"visible":"hidden",width:'16px',height:'16px',marginLeft:'16px'}} />
                                            </Dropdown>
                                        </div>
                                    </Dropdown>
                                )
                            }
                        }}
                    />
                </ConfigProvider>
            </Flex>

            <Modal title="提示" open={isMessageBoxShow} onOk={onMessageBoxOk} onCancel={()=>setIsMessageBoxShow(false)}>
                <p>是否删除这个画布？ 此操作无法恢复!</p>
            </Modal>
        </>
    )
});
export default LeftMenu;























