import { create } from 'zustand';

export type ModalType = 'success' | 'error' | 'confirmation' | 'info' | 'loading';

interface ModalAction {
    label: string;
    onPress: () => void;
    autoClose?: boolean;
}

interface ModalState {
    visible: boolean;
    type: ModalType;
    title: string;
    description: string;
    primaryAction?: ModalAction;
    secondaryAction?: ModalAction;

    // Actions
    showModal: (config: {
        type?: ModalType;
        title: string;
        description: string;
        primaryAction?: ModalAction;
        secondaryAction?: ModalAction;
    }) => void;
    hideModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
    visible: false,
    type: 'info',
    title: '',
    description: '',
    primaryAction: undefined,
    secondaryAction: undefined,

    showModal: (config) => set({
        visible: true,
        type: config.type || 'info',
        title: config.title,
        description: config.description,
        primaryAction: config.primaryAction,
        secondaryAction: config.secondaryAction,
    }),

    hideModal: () => set({
        visible: false,
    }),
}));
