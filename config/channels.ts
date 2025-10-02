export interface ChannelConfig {
  id: string;
  name: string;
  youtubeHandle?: string;
  channelId?: string;
  enabled: boolean;
}

export const channels: ChannelConfig[] = [
  {
    id: 'ai-daily-brief',
    name: 'AI Daily Brief',
    youtubeHandle: '@AIDailyBrief',
    channelId: 'UCKelCK4ZaO6HeEI1KQjqzWA',
    enabled: true,
  },
  // Add more channels here in the future
  // {
  //   id: 'another-channel',
  //   name: 'Another AI Channel',
  //   youtubeHandle: '@AnotherChannel',
  //   enabled: true,
  // },
];
