// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type EmptyProps<T extends React.ElementType> = Omit<
  React.ComponentProps<T>,
  keyof React.ComponentProps<T>
>

export interface SearchParams {
  [key: string]: string | string[] | undefined
}
