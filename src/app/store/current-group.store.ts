import { create } from 'zustand'

interface CurrentGroupState {
  currentGroupId: string | null
  setCurrentGroup: (groupId: string) => void
  clearCurrentGroup: () => void
}

export const useCurrentGroupStore = create<CurrentGroupState>()((set) => ({
  currentGroupId: null,

  setCurrentGroup: (groupId) => set({ currentGroupId: groupId }),

  clearCurrentGroup: () => set({ currentGroupId: null }),
}))
