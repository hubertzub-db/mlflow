import type { ReactNode } from 'react';

import type { ContentSectionProps } from './shared';
import {
  ContentSectionPreHeaderArea,
  ContentSectionRoot,
  ContentSectionTableContentArea,
  CommonHeaderContent,
} from './shared';

interface ContentSectionTableProps extends Omit<ContentSectionProps, 'content'> {
  preHeader?: ReactNode; // This may be generalized to all ContentSection kinds if more use-cases occur
  table?: ReactNode;
}

export const ContentSectionTable = ({
  titleText,
  titleOverride,
  subtitle,
  buttons = [],
  table,
  preHeader,
}: ContentSectionTableProps) => {
  return (
    <ContentSectionRoot sectionLabel={titleText}>
      {preHeader && <ContentSectionPreHeaderArea>{preHeader}</ContentSectionPreHeaderArea>}
      <CommonHeaderContent titleText={titleText} titleOverride={titleOverride} subtitle={subtitle} buttons={buttons} />
      <ContentSectionTableContentArea content={table} />
    </ContentSectionRoot>
  );
};
