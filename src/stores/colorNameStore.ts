import { create } from 'zustand'


export interface ColorNameStore {
  colorName: string | undefined
  setColorName: (colorName: string | undefined) => void
}

export const useColorNameStore = create<ColorNameStore>((set) => ({
  colorName: undefined,
  setColorName: (colorName) => set(() => ({ colorName }))
}))
