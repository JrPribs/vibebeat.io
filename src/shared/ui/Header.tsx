import React from 'react';
import { TopBar } from '../../components/TopBar';

interface HeaderProps {
  onExportClick: () => void;
  onProjectsClick: () => void;
  onShareClick: () => void;
  onSaveToCloud: () => void;
}

export function Header(props: HeaderProps): JSX.Element {
  return <TopBar onExportClick={props.onExportClick} />;
}