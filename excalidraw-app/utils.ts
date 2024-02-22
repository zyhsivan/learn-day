import { ResolvablePromise } from "@excalidraw/excalidraw/types/utils";
import { unstable_batchedUpdates } from "react-dom";
import React from "react";
import { MenuProps } from "antd";
export type MenuItem = Required<MenuProps>["items"][number];

export const throttleRAF = <T extends any[]>(
    fn: (...args: T) => void,
    opts?: { trailing?: boolean }
) => {
    let timerId: number | null = null;
    let lastArgs: T | null = null;
    let lastArgsTrailing: T | null = null;

    const scheduleFunc = (args: T) => {
        timerId = window.requestAnimationFrame(() => {
            timerId = null;
            fn(...args);
            lastArgs = null;
            if (lastArgsTrailing) {
                lastArgs = lastArgsTrailing;
                lastArgsTrailing = null;
                scheduleFunc(lastArgs);
            }
        });
    };

    const ret = (...args: T) => {
        if (process.env.NODE_ENV === "test") {
            fn(...args);
            return;
        }
        lastArgs = args;
        if (timerId === null) {
            scheduleFunc(lastArgs);
        } else if (opts?.trailing) {
            lastArgsTrailing = args;
        }
    };
    ret.flush = () => {
        if (timerId !== null) {
            cancelAnimationFrame(timerId);
            timerId = null;
        }
        if (lastArgs) {
            fn(...(lastArgsTrailing || lastArgs));
            lastArgs = lastArgsTrailing = null;
        }
    };
    ret.cancel = () => {
        lastArgs = lastArgsTrailing = null;
        if (timerId !== null) {
            cancelAnimationFrame(timerId);
            timerId = null;
        }
    };
    return ret;
};

export const withBatchedUpdates = <
    TFunction extends ((event: any) => void) | (() => void)
    >(
    func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
) =>
    ((event) => {
        unstable_batchedUpdates(func as TFunction, event);
    }) as TFunction;

export const withBatchedUpdatesThrottled = <
    TFunction extends ((event: any) => void) | (() => void)
    >(
    func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never
) => {
    // @ts-ignore
    return throttleRAF<Parameters<TFunction>>(((event) => {
        unstable_batchedUpdates(func, event);
    }) as TFunction);
};

export const distance2d = (x1: number, y1: number, x2: number, y2: number) => {
    const xd = x2 - x1;
    const yd = y2 - y1;
    return Math.hypot(xd, yd);
};

export const resolvablePromise = () => {
    let resolve!: any;
    let reject!: any;
    const promise = new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });
    (promise as any).resolve = resolve;
    (promise as any).reject = reject;
    return promise as ResolvablePromise<any>;
};

//获取参数
export function getQueryParam(variable:string) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return decodeURI(pair[1]);}
    }
    return(false);
}


/**
 * 字符串是否为空
 * @param szStr
 * @returns {boolean}
 */
export function isStringNullOrEmpty(szStr:string){
    return szStr == undefined || szStr == null || szStr == '';
}

//uuid
export function generateUUID() {
    var d = new Date().getTime();
    if (window.performance && typeof window.performance.now === "function") {
        d += performance.now(); //use high-precision timer if available
    }
    var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

export function generateUUID2() {
    function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    }
    return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}


export function getItem(
  label: React.ReactNode,
  key?: React.Key | null,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
  onClick?:any
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
    onClick
  } as MenuItem;
}
