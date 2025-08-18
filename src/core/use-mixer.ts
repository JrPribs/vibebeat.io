import { useState, useEffect } from 'react';
import { mixerService, type ChannelConfig } from './mixer-service';

export interface MixerState {
  masterVolume: number;
  channels: Map<string, ChannelConfig>;
}

export function useMixer() {
  const [state, setState] = useState<MixerState>({
    masterVolume: 0.8,
    channels: new Map()
  });

  useEffect(() => {
    // Initialize with current mixer state
    setState({
      masterVolume: mixerService.getMasterVolume(),
      channels: mixerService.getAllChannels()
    });
  }, []);

  return {
    ...state,
    setMasterVolume: (volume: number) => {
      mixerService.setMasterVolume(volume);
      setState(prev => ({ ...prev, masterVolume: volume }));
    },
    setChannelVolume: (channelId: string, volume: number) => {
      mixerService.setChannelVolume(channelId, volume);
      setState(prev => ({ ...prev, channels: mixerService.getAllChannels() }));
    },
    setChannelPan: (channelId: string, pan: number) => {
      mixerService.setChannelPan(channelId, pan);
      setState(prev => ({ ...prev, channels: mixerService.getAllChannels() }));
    },
    toggleMute: (channelId: string) => {
      mixerService.toggleChannelMute(channelId);
      setState(prev => ({ ...prev, channels: mixerService.getAllChannels() }));
    },
    toggleSolo: (channelId: string) => {
      mixerService.toggleChannelSolo(channelId);
      setState(prev => ({ ...prev, channels: mixerService.getAllChannels() }));
    }
  };
}