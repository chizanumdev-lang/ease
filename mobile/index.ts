import 'react-native-gesture-handler';
import 'react-native-reanimated';
import 'react-native-get-random-values';
import { registerRootComponent } from 'expo';
import notifee, { EventType } from '@notifee/react-native';
import { useAudioStore } from './src/store/audioStore';

import App from './App';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './src/services/playbackService';

notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS && detail.pressAction?.id === 'play_subliminals') {
        console.log('[BackgroundEvent] play_subliminals action received');
        const { ritualTracks, loadTrack, play } = useAudioStore.getState();
        if (ritualTracks?.night) {
            try {
                await loadTrack(ritualTracks.night);
                await play();
            } catch (error) {
                console.error('[BackgroundEvent] Failed to load/play nightly subliminal', error);
            }
        }
    }
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
TrackPlayer.registerPlaybackService(() => PlaybackService);
