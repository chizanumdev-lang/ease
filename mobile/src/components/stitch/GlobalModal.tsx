import React from 'react';
import { useModalStore } from '../../store/modalStore';
import StitchModal from './StitchModal';

export default function GlobalModal() {
    const { 
        visible, 
        type, 
        title, 
        description, 
        primaryAction, 
        secondaryAction, 
        hideModal 
    } = useModalStore();

    if (!visible) return null;

    return (
        <StitchModal
            visible={visible}
            onClose={hideModal}
            type={type}
            title={title}
            description={description}
            primaryAction={primaryAction ? {
                label: primaryAction.label,
                onPress: () => {
                    primaryAction.onPress();
                    if (primaryAction.autoClose !== false) {
                        hideModal();
                    }
                }
            } : undefined}
            secondaryAction={secondaryAction ? {
                label: secondaryAction.label,
                onPress: () => {
                    secondaryAction.onPress();
                    if (secondaryAction.autoClose !== false) {
                        hideModal();
                    }
                }
            } : undefined}
        />
    );
}
