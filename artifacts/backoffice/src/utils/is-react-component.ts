/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react";

type ReactComponent = React.FC | React.ComponentClass;

export const isFunctionComponent = (component: any): component is React.FC => {
  return typeof component === "function";
};

export const isClassComponent = (component: any): component is React.ComponentClass => {
  return typeof component === "function" && component.prototype && (!!component.prototype.isReactComponent || !!component.prototype.render);
};

export const isForwardRefComponent = (component: any): component is React.ForwardRefExoticComponent<any> => {
  return typeof component === "object" && component !== null && component.$$typeof?.toString() === "Symbol(react.forward_ref)";
};

export const isReactComponent = (component: any): component is ReactComponent => {
  return isFunctionComponent(component) || isForwardRefComponent(component) || isClassComponent(component);
};
