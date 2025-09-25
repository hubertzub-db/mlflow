import type { ContentSectionProps } from './shared';
import {
  ContentSectionButtons,
  ContentSectionContentArea,
  ContentSectionHeaderArea,
  ContentSectionRoot,
  ContentSectionSubtitle,
  ContentSectionTitle,
  ContentSectionTitleArea,
} from './shared';

/**
 * A section of content with a title, subtitle, content, and optional buttons.
 * @param titleText - The main title text for the section (always required even if overridden for accessibility)
 * @param titleOverride - Optional override for the title, if provided will be used instead of titleText
 * @param subtitle - Optional subtitle text to display below the title
 * @param content - The main content of the section
 * @param buttons - Optional array of button elements to display in the header
 * @param paginationHidden - If true, removes bottom border from cells in the last row of tables. Default is false. Makes table look cleaner inside ContentSection.
 * @constructor
 */
export const ContentSection = ({ titleText, titleOverride, subtitle, content, buttons = [] }: ContentSectionProps) => {
  return (
    <ContentSectionRoot sectionLabel={titleText}>
      <ContentSectionHeaderArea>
        <ContentSectionTitleArea>
          <ContentSectionTitle titleText={titleText} titleOverride={titleOverride} />
          {subtitle && <ContentSectionSubtitle subtitle={subtitle} />}
        </ContentSectionTitleArea>
        {buttons?.length > 0 && <ContentSectionButtons buttons={buttons} />}
      </ContentSectionHeaderArea>
      <ContentSectionContentArea content={content} />
    </ContentSectionRoot>
  );
};
