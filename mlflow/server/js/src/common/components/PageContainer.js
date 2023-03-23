import React from 'react';
import PropTypes from 'prop-types';
import { PageWrapper, Spacer } from '@databricks/design-system';

export function PageContainer(props) {
  return (
    <PageWrapper css={props.usesFullHeight ? styles.useFullHeightLayout : styles.wrapper}>
      <Spacer css={styles.fixedSpacer} />
      {props.usesFullHeight ? props.children : <div {...props} css={styles.container} />}
    </PageWrapper>
  );
}

PageContainer.propTypes = {
  usesFullHeight: PropTypes.bool,
  children: PropTypes.node,
};

PageContainer.defaultProps = {
  usesFullHeight: false,
};

const styles = {
  useFullHeightLayout: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '&:last-child': {
      flexGrow: 1,
    },
  },
  wrapper: { flex: 1 },
  fixedSpacer: {
    // Ensure spacer's fixed height regardless of flex
    flexShrink: 0,
  },
  container: {
    width: '100%',
    flexGrow: 1,
    paddingBottom: 24,
  },
};
