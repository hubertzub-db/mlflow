import { css } from '@emotion/react';
import type { ReactNode } from 'react';

import { Tabs, useDesignSystemTheme } from '@databricks/design-system';

import {
  CommonHeaderContent,
  ContentSectionContentArea,
  ContentSectionPairsContentArea,
  ContentSectionRoot,
  ContentSectionTableContentArea,
  useContentSectionTheme,
} from './shared';
import type { ContentSectionPairsProps, ContentSectionProps } from './shared';

interface ContentSectionTabbedProps extends Omit<ContentSectionProps, 'content'> {
  activeTab: string;
  onActiveTabChange: (tab: string) => void;
  tabs: Array<
    {
      id: string;
      title: string;
    } & (
      | { contentType: 'generic'; content: ReactNode }
      | { contentType: 'table'; table: ReactNode }
      | ({ contentType: 'pairs' } & ContentSectionPairsProps)
    )
  >;
}

export const ContentSectionTabbed = ({
  titleText,
  titleOverride,
  subtitle,
  buttons,
  tabs,
  activeTab,
  onActiveTabChange,
}: ContentSectionTabbedProps) => {
  const { headerPaddingPx, headerBackgroundColor, headerBorderColor } = useContentSectionTheme();
  const { theme } = useDesignSystemTheme();
  const activeTabObject = tabs.find((tab) => tab.id === activeTab);
  const isTable = activeTabObject?.contentType === 'table';

  const tabsListStyles = css`
    padding-left: ${headerPaddingPx}px;
    background: ${headerBackgroundColor};
    border-bottom: 1px solid ${headerBorderColor};
    /* Tabs list has gradient burried on tab control buttons */
    * {
      background: none;
    }
  `;

  const tabsListContainerStyles = css`
    margin-bottom: ${isTable
      ? theme.spacing.sm
      : 0}px; // rely on default content spacing for generic content, table headers need extra spacing
    background: ${headerBackgroundColor};
    width: 100%;
    > * {
      margin-bottom: 0 !important; // Needed to control the tab list margin-bottom
    }
  `;

  return (
    <ContentSectionRoot sectionLabel={titleText}>
      <Tabs.Root componentId="content-section-tabbed" value={activeTab} onValueChange={onActiveTabChange}>
        <CommonHeaderContent
          bottomBorder={false}
          titleText={titleText}
          titleOverride={titleOverride}
          subtitle={subtitle}
          buttons={buttons}
        />
        <div css={tabsListContainerStyles}>
          <Tabs.List css={tabsListStyles}>
            {tabs.map((tab) => (
              <Tabs.Trigger key={tab.id} value={tab.id}>
                {tab.title}
              </Tabs.Trigger>
            ))}
          </Tabs.List>
        </div>
        {activeTabObject && (
          <Tabs.Content value={activeTab}>
            {activeTabObject.contentType === 'table' ? (
              <ContentSectionTableContentArea content={activeTabObject.table} />
            ) : activeTabObject.contentType === 'pairs' ? (
              <ContentSectionPairsContentArea pairs={activeTabObject.pairs} />
            ) : (
              <ContentSectionContentArea content={activeTabObject.content} />
            )}
          </Tabs.Content>
        )}
      </Tabs.Root>
    </ContentSectionRoot>
  );
};
