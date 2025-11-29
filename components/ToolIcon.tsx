import React from 'react';
import { ToolIconName } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { GlobeIcon } from './icons/GlobeIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { SearchIcon } from './icons/SearchIcon';
import { TuneIcon } from './icons/TuneIcon';
import { CodeIcon } from './icons/CodeIcon';
import { DatabaseIcon } from './icons/DatabaseIcon';
import { MailIcon } from './icons/MailIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { CpuIcon } from './icons/CpuIcon';
import { ZapIcon } from './icons/ZapIcon';
import { ActivityIcon } from './icons/ActivityIcon';
import { CloudIcon } from './icons/CloudIcon';
import { CommandIcon } from './icons/CommandIcon';
import { FolderIcon } from './icons/FolderIcon';
import { KeyIcon } from './icons/KeyIcon';
import { LayersIcon } from './icons/LayersIcon';
import { LockIcon } from './icons/LockIcon';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { MonitorIcon } from './icons/MonitorIcon';
import { PackageIcon } from './icons/PackageIcon';
import { PieChartIcon } from './icons/PieChartIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { SaveIcon } from './icons/SaveIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { StarIcon } from './icons/StarIcon';
import { TagIcon } from './icons/TagIcon';
import { TargetIcon } from './icons/TargetIcon';
import { UploadIcon } from './icons/UploadIcon';
import { UsersIcon } from './icons/UsersIcon';
import { VideoIcon } from './icons/VideoIcon';
import { PlayCircleIcon } from './icons/PlayCircleIcon';
import { PauseCircleIcon } from './icons/PauseCircleIcon';
import { CameraIcon } from './icons/CameraIcon';
import { MusicIcon } from './icons/MusicIcon';
import { FilmIcon } from './icons/FilmIcon';
import { MicIcon } from './icons/MicIcon';
import { HeadphonesIcon } from './icons/HeadphonesIcon';
import { SpeakerIcon } from './icons/SpeakerIcon';

interface ToolIconProps {
  icon: ToolIconName;
  className?: string;
}

export const ToolIcon: React.FC<ToolIconProps> = ({ icon, className = 'w-5 h-5' }) => {
  const props = { className };
  switch (icon) {
    case 'image':
      return <ImageIcon {...props} />;
    case 'lightbulb':
      return <LightbulbIcon {...props} />;
    case 'book-open':
      return <BookOpenIcon {...props} />;
    case 'globe':
      return <GlobeIcon {...props} />;
    case 'search':
    case 'deep-research':
      return <SearchIcon {...props} />;
    case 'tune':
      return <TuneIcon {...props} />;
    case 'code':
      return <CodeIcon {...props} />;
    case 'database':
      return <DatabaseIcon {...props} />;
    case 'mail':
      return <MailIcon {...props} />;
    case 'calendar':
      return <CalendarIcon {...props} />;
    case 'terminal':
      return <TerminalIcon {...props} />;
    case 'cpu':
      return <CpuIcon {...props} />;
    case 'zap':
      return <ZapIcon {...props} />;
    case 'activity':
      return <ActivityIcon {...props} />;
    case 'cloud':
      return <CloudIcon {...props} />;
    case 'command':
      return <CommandIcon {...props} />;
    case 'folder':
      return <FolderIcon {...props} />;
    case 'key':
      return <KeyIcon {...props} />;
    case 'layers':
      return <LayersIcon {...props} />;
    case 'lock':
      return <LockIcon {...props} />;
    case 'message-square':
      return <MessageSquareIcon {...props} />;
    case 'monitor':
      return <MonitorIcon {...props} />;
    case 'package':
      return <PackageIcon {...props} />;
    case 'pie-chart':
      return <PieChartIcon {...props} />;
    case 'refresh':
      return <RefreshIcon {...props} />;
    case 'save':
      return <SaveIcon {...props} />;
    case 'shield':
      return <ShieldIcon {...props} />;
    case 'star':
      return <StarIcon {...props} />;
    case 'tag':
      return <TagIcon {...props} />;
    case 'target':
      return <TargetIcon {...props} />;
    case 'upload':
      return <UploadIcon {...props} />;
    case 'users':
      return <UsersIcon {...props} />;
    case 'video':
      return <VideoIcon {...props} />;
    case 'play-circle':
      return <PlayCircleIcon {...props} />;
    case 'pause-circle':
      return <PauseCircleIcon {...props} />;
    case 'camera':
      return <CameraIcon {...props} />;
    case 'music':
      return <MusicIcon {...props} />;
    case 'film':
      return <FilmIcon {...props} />;
    case 'mic':
      return <MicIcon {...props} />;
    case 'headphones':
      return <HeadphonesIcon {...props} />;
    case 'speaker':
      return <SpeakerIcon {...props} />;
    default:
      return <SettingsIcon {...props} />;
  }
};
