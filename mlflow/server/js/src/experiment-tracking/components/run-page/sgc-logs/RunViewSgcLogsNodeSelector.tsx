import {
  Button,
  Card,
  CheckboxIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DropdownMenu,
  Spacer,
  Typography,
  useDesignSystemTheme,
} from '@databricks/design-system';
import type { KeyValueEntity } from '../../../../common/types';
import ArtifactPage from '../../ArtifactPage';
import { useMediaQuery } from '@databricks/web-shared/hooks';
import { UseGetRunQueryResponseOutputs } from '../hooks/useGetRunQuery';
import { ContentSection } from '@databricks/web-shared/utils';
import { useState } from 'react';
import { getStableColorForRun } from '../../../utils/RunNameUtils';

/**
 * A run page tab containing the artifact browser
 */
export const RunViewSgcLogsNodeSelector = ({
  runTags,
  runUuid,
}: {
  runUuid: string;
  runTags: Record<string, KeyValueEntity>;
}) => {
  const { theme } = useDesignSystemTheme();
  const [open, changeOpen] = useState(false);

  return (
    <DropdownMenu.Root open={open} onOpenChange={changeOpen}>
      <DropdownMenu.Trigger asChild>
        <Button
          componentId="TODO"
          endIcon={<ChevronDownIcon />}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onClick={() => {}}
        >
          <Typography.Text>Filter by node</Typography.Text>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" css={{ fontSize: 13 }}>
        {new Array(2).fill('').map((_, index) => (
          <DropdownMenu.Sub key={'k' + index}>
            <DropdownMenu.SubTrigger
              onClick={() => {
                changeOpen(false);
              }}
              css={{ display: 'flex', gap: 8 }}
            >
              {/* <DropdownMenu.CheckboxItem css={{ display: 'flex', alignItems: 'center', gap: 8 }} checked> */}
              <div css={{ width: 16 }} />
              <div
                css={{
                  backgroundColor: getStableColorForRun(`node_${index}`),
                  borderRadius: '100%',
                  width: 12,
                  height: 12,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: '#888',
                }}
              />
              <Typography.Text>Node {index + 1}</Typography.Text>
              {/* </DropdownMenu.CheckboxItem> */}
            </DropdownMenu.SubTrigger>
            <DropdownMenu.SubContent>
              {new Array(8).fill('').map((_, cindex) => (
                <DropdownMenu.CheckboxItem
                  onClick={() => {
                    changeOpen(false);
                  }}
                  css={{ display: 'flex', gap: 8 }}
                  checked={cindex === 3}
                >
                  {/* <DropdownMenu.CheckboxItem css={{ display: 'flex', alignItems: 'center', gap: 8 }} checked> */}
                  <DropdownMenu.ItemIndicator />
                  {/* <div
                css={{
                  backgroundColor: getStableColorForRun(`node_${index}`),
                  borderRadius: '100%',
                  width: 12,
                  height: 12,
                  borderWidth: 1,
                  borderStyle: 'solid',
                  borderColor: '#888',
                }}
              /> */}
                  <Typography.Text>Chip {cindex + 1}</Typography.Text>
                  {/* </DropdownMenu.CheckboxItem> */}
                </DropdownMenu.CheckboxItem>
              ))}
            </DropdownMenu.SubContent>
          </DropdownMenu.Sub>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
