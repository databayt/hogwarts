"use client";
import React from "react";
import { GlobalContextProvider } from "./global-context";

interface Props {
  children: React.ReactNode;
}

function ContextProvider({ children }: Props) {
  return <GlobalContextProvider>{children}</GlobalContextProvider>;
}

export default ContextProvider;
