/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ArrowForward, Warning } from '@mui/icons-material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import React from 'react';
import { useTranslation } from 'react-i18next';
import Pod from '../../lib/k8s/pod';
import Service from '../../lib/k8s/service';
import { timeAgo } from '../../lib/util';
import Empty from '../common/EmptyContent';
import Link from '../common/Link';
import DeleteButton from '../common/Resource/DeleteButton';
import { SectionBox } from '../common/SectionBox';
import SimpleTable from '../common/SimpleTable';

export interface SelectedPodsProps {
  service: Service;
}

/**
 * Convert a plain label selector object to a Kubernetes label selector query string.
 * Example: { app: 'frontend', env: 'prod' } => 'app=frontend,env=prod'
 */
function selectorToLabelSelector(selector: { [key: string]: string }): string {
  return Object.entries(selector)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export default function SelectedPods({ service }: SelectedPodsProps) {
  const { t } = useTranslation();
  const selector = service.spec.selector;
  const namespace = service.getNamespace();
  const cluster = service.cluster;

  // Handle empty selector - this would match ALL pods in namespace
  const isEmptySelector = selector && Object.keys(selector).length === 0;

  // Build label selector string for API query
  const labelSelector = React.useMemo(() => {
    if (!selector) return '';
    return selectorToLabelSelector(selector);
  }, [selector]);

  const [pods, podsError] = Pod.useList({
    namespace,
    cluster,
    labelSelector,
  });

  // Pagination state
  const [showAll, setShowAll] = React.useState(false);
  const PAGE_SIZE = 10;
  const displayedPods = showAll ? pods : pods?.slice(0, PAGE_SIZE);
  const hasMore = (pods?.length || 0) > PAGE_SIZE;

  // Don't render if no selector (ExternalName services)
  if (!selector) {
    return null;
  }

  // Handle empty selector warning
  if (isEmptySelector) {
    return (
      <SectionBox title={t('Selected Pods')}>
        <Alert severity="warning" icon={<Warning />}>
          {t('This service has an empty selector, which matches all pods in the namespace.')}
        </Alert>
        {pods && pods.length > 0 && (
          <SimpleTable
            data={pods}
            columns={[
              {
                label: t('translation|Name'),
                getter: pod => <Link kubeObject={pod} />,
              },
              {
                label: t('translation|Status'),
                getter: pod => pod.status.phase,
              },
              {
                label: t('translation|Age'),
                getter: pod => timeAgo(pod.metadata.creationTimestamp),
              },
              {
                label: t('translation|Node'),
                getter: pod => pod.spec.nodeName || '-',
              },
              {
                label: '',
                getter: pod => <DeleteButton item={pod} buttonStyle="menu" />,
              },
            ]}
          />
        )}
      </SectionBox>
    );
  }

  // Handle error state
  if (podsError) {
    return (
      <SectionBox title={t('Selected Pods')}>
        <Empty color="error">{podsError.toString()}</Empty>
      </SectionBox>
    );
  }

  // Handle loading/empty state
  if (!pods || pods.length === 0) {
    return (
      <SectionBox title={t('Selected Pods')}>
        <Empty>{t("No pods match this service's selector")}</Empty>
      </SectionBox>
    );
  }

  return (
    <SectionBox title={t('Selected Pods')}>
      <SimpleTable
        data={displayedPods}
        columns={[
          {
            label: t('translation|Name'),
            getter: pod => <Link kubeObject={pod} />,
          },
          {
            label: t('translation|Status'),
            getter: pod => pod.status.phase,
          },
          {
            label: t('translation|Age'),
            getter: pod => timeAgo(pod.metadata.creationTimestamp),
          },
          {
            label: t('translation|Node'),
            getter: pod => pod.spec.nodeName || '-',
          },
          {
            label: '',
            getter: pod => <DeleteButton item={pod} buttonStyle="menu" />,
          },
        ]}
      />
      {hasMore && !showAll && (
        <Button onClick={() => setShowAll(true)} startIcon={<ArrowForward />} sx={{ mt: 2 }}>
          {t('Load More ({{count}} more)', { count: pods.length - PAGE_SIZE })}
        </Button>
      )}
    </SectionBox>
  );
}
