import {
  Database,
  FileSearch,
  GitBranchPlus,
  GitMerge,
  Scale,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

export type WorkspaceId =
  | 'welcome'
  | 'explore'
  | 'analyze'
  | 'decisions'
  | 'enrich'
  | 'manage'
  | 'ontology-hub';

export type NavItem = {
  id: WorkspaceId;
  label: string;
  hint: string;
  icon: LucideIcon;
};

/** Left-rail workspace buttons (order is part of the operator catalog contract). */
export const NAV_ITEMS: NavItem[] = [
  { id: 'explore', label: 'Knowledge Explorer', hint: 'Graph and vocabulary browsing', icon: Database },
  { id: 'analyze', label: 'Analyze', hint: 'Query and inspect the dataset', icon: FileSearch },
  { id: 'decisions', label: 'Decisions', hint: 'Decision chains and precedent review', icon: Scale },
  { id: 'enrich', label: 'Enrich', hint: 'Import, export, and merge workflows', icon: GitBranchPlus },
  { id: 'manage', label: 'Manage', hint: 'Lineage and governance tooling', icon: Settings2 },
  { id: 'ontology-hub', label: 'Ontology Hub', hint: 'Schema governance, registry, and vocabulary management', icon: GitMerge },
];

/** Brand pill label on the app rail. */
export const RAIL_BRAND_LABEL = 'SKE';
