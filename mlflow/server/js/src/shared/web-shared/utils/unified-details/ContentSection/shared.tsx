import { css } from '@emotion/react';
import { Fragment, type ReactElement, type ReactNode } from 'react';

import { Typography, useDesignSystemTheme } from '@databricks/design-system';

// Storybook here: /universe/js/packages/du-bois/src/shared-components/DetailsPagePattern/ContentSection/ContentSection.stories.tsx
export interface ContentSectionProps {
  titleText: string;
  titleOverride?: ReactNode; // If provided, will render instead of title text. titleText is always required to semantically label the section
  subtitle?: ReactNode;
  content: React.ReactNode;
  buttons?: Array<ReactElement | null | false | undefined>;
}

export interface ContentSectionTheme {
  headerPaddingPx: number;
  headerBackgroundSecondaryColor: string;
  headerBackgroundColor: string;
  headerBorderColor: string;
  headerButtonSpacingPx: number;
  contentPaddingPx: number;
  cardBorderColor: string;
  cardBorderRadius: number;
}

export const useContentSectionTheme = (): ContentSectionTheme => {
  const { theme } = useDesignSystemTheme();
  const headerPaddingPx = theme.spacing.xs * 3;
  return {
    headerPaddingPx,
    headerBackgroundSecondaryColor: theme.colors.backgroundPrimary,
    headerBackgroundColor: theme.colors.backgroundSecondary,
    headerBorderColor: theme.colors.border,
    headerButtonSpacingPx: theme.spacing.sm,
    contentPaddingPx: theme.spacing.xs * 3,
    cardBorderColor: theme.colors.border,
    cardBorderRadius: theme.borders.borderRadiusMd,
  };
};

export const ContentSectionRoot = ({ children, sectionLabel }: { children: ReactNode; sectionLabel: string }) => {
  const { cardBorderColor, cardBorderRadius } = useContentSectionTheme();
  const cardWrapperStyle = css`
    border: 1px solid ${cardBorderColor};
    border-radius: ${cardBorderRadius}px;
    overflow: hidden;
  `;

  return (
    <section css={cardWrapperStyle} aria-label={sectionLabel}>
      {children}
    </section>
  );
};

export const ContentSectionPreHeaderArea = ({
  children,
  bottomBorder = true,
}: {
  children: ReactNode;
  bottomBorder?: boolean;
}) => {
  const { headerPaddingPx, headerBorderColor, headerBackgroundColor } = useContentSectionTheme();

  const cardHeaderStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${headerPaddingPx}px;
    border-bottom: ${bottomBorder ? `1px solid ${headerBorderColor}` : 'none'};
    background: ${headerBackgroundColor};
  `;

  return (
    <div css={cardHeaderStyle} className="content-section-header">
      {children}
    </div>
  );
};

export const CommonHeaderContent = ({
  titleText,
  titleOverride,
  subtitle,
  buttons,
  bottomBorder = true,
}: Omit<ContentSectionProps, 'content'> & { bottomBorder?: boolean }) => {
  return (
    <ContentSectionHeaderArea bottomBorder={bottomBorder}>
      <ContentSectionTitleArea>
        <ContentSectionTitle titleText={titleText} titleOverride={titleOverride} />
        {subtitle && <ContentSectionSubtitle subtitle={subtitle} />}
      </ContentSectionTitleArea>
      {buttons && buttons.length > 0 && <ContentSectionButtons buttons={buttons} />}
    </ContentSectionHeaderArea>
  );
};

export const ContentSectionHeaderArea = ({
  children,
  bottomBorder = true,
}: {
  children: ReactNode;
  bottomBorder?: boolean;
}) => {
  const { headerPaddingPx, headerBackgroundColor, headerBorderColor } = useContentSectionTheme();

  const cardHeaderStyle = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${headerPaddingPx}px;
    border-bottom: ${bottomBorder ? `1px solid ${headerBorderColor}` : 'none'};
    background: ${headerBackgroundColor};
  `;

  return (
    <div css={cardHeaderStyle} className="content-section-header">
      {children}
    </div>
  );
};

export const ContentSectionTitleArea = ({ children }: { children: ReactNode }) => {
  const { headerBackgroundSecondaryColor } = useContentSectionTheme();
  const { theme } = useDesignSystemTheme();

  const titleAreaStyle = css`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-right: ${theme.spacing.md}px;

    /* this hack fixes the background color of table filter inputs */
    .du-bois-light-input-affix-wrapper {
      background-color: ${headerBackgroundSecondaryColor} !important;
    }
  `;

  return <div css={titleAreaStyle}>{children}</div>;
};

export const ContentSectionTitle = ({
  titleText,
  titleOverride,
}: Pick<ContentSectionProps, 'titleText' | 'titleOverride'>) => {
  const titleAreaStyle = css`
    display: flex;
    flex-direction: column;
  `;

  return (
    <div css={titleAreaStyle}>
      {titleOverride ?? (
        <Typography.Text bold size="md" aria-label={titleText}>
          {titleText}
        </Typography.Text>
      )}
    </div>
  );
};

export const ContentSectionSubtitle = ({ subtitle }: Pick<ContentSectionProps, 'subtitle'>) => {
  return (
    <Typography.Paragraph color="secondary" withoutMargins>
      {subtitle}
    </Typography.Paragraph>
  );
};

export const ContentSectionButtons = ({ buttons }: Pick<ContentSectionProps, 'buttons'>) => {
  const { headerButtonSpacingPx } = useContentSectionTheme();

  const buttonContainerStyle = css`
    display: flex;
    justify-content: flex-end;
    gap: ${headerButtonSpacingPx}px;
  `;

  return <div css={buttonContainerStyle}>{buttons}</div>;
};

export const ContentSectionContentArea = ({ content }: { content: ReactNode }) => {
  const { contentPaddingPx } = useContentSectionTheme();

  const contentStyle = css`
    padding: ${contentPaddingPx}px;
  `;

  return <div css={contentStyle}>{content}</div>;
};

export const ContentSectionTableContentArea = ({ content }: { content: ReactNode }) => {
  const { headerPaddingPx } = useContentSectionTheme();
  const { theme } = useDesignSystemTheme();

  const contentStyle = css`
    padding: 0;

    /* Hide bottom border from the last row of tables */
    div[role='table']:last-child {
      div[role='row']:last-child {
        div[role='cell'] {
          border-bottom: none;
        }
      }
    }

    /* Add padding to the first column of tables to align with header title */
    [role='row'] > [role='columnheader']:first-child {
      padding-left: ${headerPaddingPx}px;
    }
    [role='row'] > [role='cell']:first-child {
      padding-left: ${headerPaddingPx}px;
    }

    /* Prevents pagination buttons from bumping into card border */
    .du-bois-dark-pagination,
    .du-bois-light-pagination {
      margin-right: ${theme.spacing.sm}px;
    }
  `;

  return <div css={contentStyle}>{content}</div>;
};

export interface ContentSectionPairsProps {
  pairs: { id: string; label: ReactNode; value: ReactNode }[];
}

export const ContentSectionPairsContentArea = ({ pairs }: ContentSectionPairsProps) => {
  const { theme } = useDesignSystemTheme();
  const { contentPaddingPx } = useContentSectionTheme();

  const pairsStyles = css`
    display: grid;
    grid-template-columns: auto auto;
    width: fit-content;
    row-gap: ${theme.spacing.md}px;
    column-gap: ${theme.spacing.sm * 8}px;
    padding: ${contentPaddingPx}px;
  `;

  return (
    <div css={pairsStyles}>
      {pairs.map(({ id, value, label }) => {
        const labelId = `${id}-label`;
        return (
          <Fragment key={id}>
            <Typography.Text color="secondary" id={labelId}>
              {label}
            </Typography.Text>
            <div aria-labelledby={labelId}>{value}</div>
          </Fragment>
        );
      })}
    </div>
  );
};
