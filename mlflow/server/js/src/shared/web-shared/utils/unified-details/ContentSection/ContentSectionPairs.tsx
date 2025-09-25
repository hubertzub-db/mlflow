import { CommonHeaderContent, ContentSectionPairsContentArea, ContentSectionRoot } from './shared';
import type { ContentSectionPairsProps, ContentSectionProps } from './shared';

export const ContentSectionPairs = ({
  titleText,
  titleOverride,
  subtitle,
  pairs,
  buttons = [],
}: Omit<ContentSectionProps, 'content'> & ContentSectionPairsProps) => {
  return (
    <ContentSectionRoot sectionLabel={titleText}>
      <CommonHeaderContent titleText={titleText} titleOverride={titleOverride} subtitle={subtitle} buttons={buttons} />
      <ContentSectionPairsContentArea pairs={pairs} />
    </ContentSectionRoot>
  );
};
