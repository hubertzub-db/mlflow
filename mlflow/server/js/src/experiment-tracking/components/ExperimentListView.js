import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { debounce } from 'lodash';

import { List } from 'antd';
import VirtualList from 'rc-virtual-list';
import {
  Input,
  Typography,
  CaretDownSquareIcon,
  PlusCircleBorderIcon,
  PencilIcon,
  Checkbox,
  SearchIcon,
} from '@databricks/design-system';
import { Link, withRouter } from 'react-router-dom';
import { experimentListSearchInput, searchExperimentsApi } from '../actions';
import {
  getExperimentListSearchInput,
  getExperimentListPreviousSearchInput,
  getExperiments,
  getSearchExperimentsNextPageToken,
  getLoadingMoreExperiments,
} from '../reducers/Reducers';
import Routes from '../routes';
import { CreateExperimentModal } from './modals/CreateExperimentModal';
import { DeleteExperimentModal } from './modals/DeleteExperimentModal';
import { RenameExperimentModal } from './modals/RenameExperimentModal';
import { IconButton } from '../../common/components/IconButton';
import { Spinner } from '../../common/components/Spinner';

export class ExperimentListView extends Component {
  static propTypes = {
    activeExperimentIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    history: PropTypes.object.isRequired,
    // All below depend on connect
    dispatchSearchExperimentsApi: PropTypes.func.isRequired,
    dispatchSearchInput: PropTypes.func.isRequired,
    experiments: PropTypes.arrayOf(PropTypes.object).isRequired,
    searchInput: PropTypes.string.isRequired,
    previousSearchInput: PropTypes.string.isRequired,
    nextPageToken: PropTypes.string,
    loadingMore: PropTypes.bool.isRequired,
  };

  state = {
    hidden: false,
    showCreateExperimentModal: false,
    showDeleteExperimentModal: false,
    showRenameExperimentModal: false,
    selectedExperimentId: '0',
    selectedExperimentName: '',
    checkedKeys: [],
    innerHeight: 90,
  };

  resizeObserver = null;

  componentDidMount() {
    // Dynamically set the height of the container list based on root element
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        const height = Math.abs(entries[0].contentRect.height * 0.8);
        this.setState({ innerHeight: height });
      });

      this.resizeObserver.observe(document.getElementById('root'));
    }
  }

  componentWillUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  handleSearchInputChange = (event) => {
    this.props.dispatchSearchInput(event.target.value);
  };

  handleLoadMore = (event) => {
    let params = {};
    const currentInput = this.props.searchInput;
    const previousInput = this.props.previousSearchInput;
    // Leave the filter off if we have a blank string.
    if (currentInput !== '') {
      params = { ...params, filter: `name LIKE '%${currentInput}%'` };
    }
    // Use a next page if the input was not altered to get more.
    if (currentInput === previousInput) {
      params = { ...params, pageToken: this.props.nextPageToken };
    }
    // Need to dispatch both to make the prior and current match on
    // multiple searches of the same input.
    this.props.dispatchSearchInput(currentInput);
    this.props.dispatchSearchExperimentsApi(params);
  };

  onScroll = (event) => {
    if (
      Math.abs(
        event.target.scrollHeight -
          (event.target.scrollTop + event.target.getBoundingClientRect().bottom) <=
          1,
      )
    ) {
      this.handleLoadMore();
    }
  };
  debouncedOnScroll = debounce(this.onScroll, 30);

  updateSelectedExperiment = (experimentId, experimentName) => {
    this.setState({
      selectedExperimentId: experimentId,
      selectedExperimentName: experimentName,
    });
  };

  handleCreateExperiment = () => {
    this.setState({
      showCreateExperimentModal: true,
    });
  };

  handleDeleteExperiment = (experimentId, experimentName) => () => {
    this.setState({
      showDeleteExperimentModal: true,
    });
    this.updateSelectedExperiment(experimentId, experimentName);
  };

  handleRenameExperiment = (experimentId, experimentName) => () => {
    this.setState({
      showRenameExperimentModal: true,
    });
    this.updateSelectedExperiment(experimentId, experimentName);
  };

  handleCloseCreateExperimentModal = () => {
    this.setState({
      showCreateExperimentModal: false,
    });
  };

  handleCloseDeleteExperimentModal = () => {
    this.setState({
      showDeleteExperimentModal: false,
    });
    // reset
    this.updateSelectedExperiment('0', '');
  };

  handleCloseRenameExperimentModal = () => {
    this.setState({
      showRenameExperimentModal: false,
    });
    // reset
    this.updateSelectedExperiment('0', '');
  };

  pushExperimentRoute = () => {
    if (this.state.checkedKeys.length > 0) {
      const route =
        this.state.checkedKeys.length === 1
          ? Routes.getExperimentPageRoute(this.state.checkedKeys[0])
          : Routes.getCompareExperimentsPageRoute(this.state.checkedKeys);
      this.props.history.push(route);
    }
  };
  handleCheck = (e, key) => {
    this.setState(
      (prevState) => ({
        checkedKeys:
          e === true && !prevState.checkedKeys.includes(key)
            ? [key, ...prevState.checkedKeys]
            : prevState.checkedKeys.filter((i) => i !== key),
      }),
      this.pushExperimentRoute,
    );
  };

  renderListItem = (item) => {
    const { activeExperimentIds } = this.props;
    const { checkedKeys } = this.state;
    const isActive = activeExperimentIds.includes(item.experiment_id);
    const dataTestId = isActive ? 'active-experiment-list-item' : 'experiment-list-item';

    return (
      <div style={classNames.experimentListItemContainer} data-test-id={dataTestId}>
        <List.Item
          key={item.experiment_id}
          bordered='false'
          prefixCls={'experiment-list-meta'}
          css={classNames.experimentListItem}
          actions={[
            <Checkbox
              id={item.experiment_id}
              key={item.experiment_id}
              onChange={(e) => this.handleCheck(e, item.experiment_id)}
              checked={checkedKeys.includes(item.experiment_id)}
            ></Checkbox>,
            <Link
              className={'experiment-link'}
              to={Routes.getExperimentPageRoute(item.experiment_id)}
              style={classNames.experimentLink}
              data-test-id='experiment-list-item-link'
            >
              {item.name}
            </Link>,
            <IconButton
              icon={<PencilIcon />}
              onClick={this.handleRenameExperiment(item.experiment_id, item.name)}
              data-test-id='rename-experiment-button'
            />,
            <IconButton
              icon={<i className='far fa-trash-o' />}
              onClick={this.handleDeleteExperiment(item.experiment_id, item.name)}
              css={classNames.deleteExperiment}
              data-test-id='delete-experiment-button'
            />,
          ]}
        ></List.Item>
      </div>
    );
  };

  render() {
    const { activeExperimentIds, experiments, searchInput, loadingMore } = this.props;
    const { hidden, innerHeight } = this.state;
    if (hidden) {
      return (
        <CaretDownSquareIcon
          rotate={-90}
          onClick={() => this.setState({ hidden: false })}
          css={{ fontSize: '24px' }}
          title='Show experiment list'
        />
      );
    }

    return (
      <div id='experiment-list-outer-container' css={classNames.experimentListOuterContainer}>
        <CreateExperimentModal
          isOpen={this.state.showCreateExperimentModal}
          onClose={this.handleCloseCreateExperimentModal}
        />
        <DeleteExperimentModal
          isOpen={this.state.showDeleteExperimentModal}
          onClose={this.handleCloseDeleteExperimentModal}
          activeExperimentIds={activeExperimentIds}
          experimentId={this.state.selectedExperimentId}
          experimentName={this.state.selectedExperimentName}
        />
        <RenameExperimentModal
          isOpen={this.state.showRenameExperimentModal}
          onClose={this.handleCloseRenameExperimentModal}
          experimentId={this.state.selectedExperimentId}
          experimentName={this.state.selectedExperimentName}
        />
        <div>
          <div style={classNames.experimentTitleContainer}>
            <Typography.Title level={2} css={classNames.experimentTitle}>
              Experiments
            </Typography.Title>
            <PlusCircleBorderIcon
              onClick={this.handleCreateExperiment}
              css={{
                fontSize: '24px',
                marginLeft: 'auto',
              }}
              title='New Experiment'
              data-test-id='create-experiment-button'
            />
            <CaretDownSquareIcon
              onClick={() => this.setState({ hidden: true })}
              rotate={90}
              css={{ fontSize: '24px' }}
              title='Hide experiment list'
            />
          </div>
          <div style={classNames.experimentSearchContainer}>
            <Input
              placeholder='Search Experiments'
              aria-label='search experiments'
              value={searchInput}
              onChange={this.handleSearchInputChange}
              onPressEnter={this.handleLoadMore}
              data-test-id='search-experiment-input'
              css={classNames.experimentSearchInput}
            />
            <SearchIcon
              onClick={this.handleLoadMore}
              title='Search/load more experiments'
              css={classNames.experimentSearchIcon}
            />
          </div>
          <div id='scrollableDiv' css={classNames.experimentListContainer}>
            <List split={false} loading={{ indicator: <Spinner />, spinning: loadingMore }}>
              <VirtualList
                data={experiments}
                itemHeight={10}
                height={innerHeight}
                itemKey='experiment_id'
                onScroll={this.debouncedOnScroll}
              >
                {(item) => this.renderListItem(item)}
              </VirtualList>
            </List>
          </div>
        </div>
      </div>
    );
  }
}

const classNames = {
  experimentListOuterContainer: {
    boxSizing: 'border-box',
    marginLeft: '24px',
    marginRight: '8px',
    // TODO getting the right width here is hard with the link
    minWidth: '200px',
    maxWidth: '400px',
  },
  experimentTitleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  experimentTitle: {
    margin: 0,
  },
  experimentSearchContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2px',
  },
  experimentSearchInput: {
    margin: 0,
    flex: '6 1 0',
  },
  experimentSearchIcon: {
    fontSize: '24px',
    marginLeft: 'auto',
    flex: '1 1 0',
  },
  experimentListContainer: {
    overflowX: 'hidden',
    marginTop: '8px',
    // Makes the scrollbar stay showing
    '.rc-virtual-list-scrollbar-show': {
      display: 'block !important',
      background: 'rgba(0, 0, 0, 0.5)',
    },
  },
  experimentListItemContainer: {
    display: 'flex',
    marginLeft: '0px',
    marginTop: '0px',
    marginBotom: '0px',
    marginRight: '5px',
    paddingRight: '5px',
  },
  experimentListItem: {
    display: 'flex',
    '.experiment-list-meta-item-action': {
      display: 'flex',
      paddingLeft: '0px',
      li: {
        paddingRight: '4px',
        display: 'flex',
        maxWidth: '60%',
      },
    },
  },
  experimentLink: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px',
    whiteSpace: 'nowrap',
    textAlign: 'left',
  },
  // Use a larger margin to avoid overlapping the vertical scrollbar
  deleteExperiment: {
    marginRight: '10px',
  },
};

const mapStateToProps = (state) => {
  const allExperiments = getExperiments(state);
  const searchInput = getExperimentListSearchInput(state);
  const previousSearchInput = getExperimentListPreviousSearchInput(state);
  const lowerCasedSearchInput = searchInput.toLowerCase();
  const loadingMore = getLoadingMoreExperiments(state);
  let experiments = [];
  // TODO should this still be a thing or should this only work from a "real"
  // search, not directly in the ui i.e. the onChange event of the input
  if (lowerCasedSearchInput !== '') {
    experiments = allExperiments.filter(({ name }) =>
      name.toLowerCase().includes(lowerCasedSearchInput),
    );
  } else {
    experiments = allExperiments;
  }
  const nextPageToken = getSearchExperimentsNextPageToken(state);
  return { experiments, nextPageToken, searchInput, previousSearchInput, loadingMore };
};

const mapDispatchToProps = (dispatch) => {
  return {
    dispatchSearchExperimentsApi: (params) => {
      return dispatch(searchExperimentsApi(params));
    },
    dispatchSearchInput: (input) => {
      return dispatch(experimentListSearchInput(input));
    },
  };
};

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(ExperimentListView));
