import { getStableColorForRun } from '../../../utils/RunNameUtils';

export const SgcLogsNodes = (() => {
  const nodes = [0, 1];
  const chips = [0, 1, 2, 3, 4, 5, 6, 7];

  return ['gpu', 'cpu'].flatMap((aa) =>
    nodes.flatMap((node) =>
      chips.map((chip) => ({
        id: `${aa}_${node}_chip_${chip}`,
        color: getStableColorForRun(`${node}_chip_${chip}`),
        metricKey: `${aa}_${node}/${chip}`,
      })),
    ),
  );
})();
