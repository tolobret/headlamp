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

import { Meta, StoryFn } from '@storybook/react';
import { http, HttpResponse } from 'msw';
import React from 'react';
import Service from '../../lib/k8s/service';
import { TestContext } from '../../test';
import SelectedPods from './SelectedPods';

const serviceWithSelector: Service = Service.create({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'example-service',
    namespace: 'default',
    resourceVersion: '12346',
    creationTimestamp: '2022-10-25T11:48:48Z',
    uid: '12345',
  },
  spec: {
    type: 'ClusterIP',
    clusterIP: '10.96.0.100',
    externalIPs: [],
    ports: [
      {
        name: 'http',
        nodePort: 0,
        protocol: 'TCP',
        port: 80,
        targetPort: 8080,
      },
    ],
    selector: {
      app: 'example',
    },
  },
  status: {
    loadBalancer: {
      ingress: [],
    },
  },
});

const serviceWithEmptySelector: Service = Service.create({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'empty-selector-service',
    namespace: 'default',
    resourceVersion: '12347',
    creationTimestamp: '2022-10-25T11:48:48Z',
    uid: '12346',
  },
  spec: {
    type: 'ClusterIP',
    clusterIP: '10.96.0.101',
    externalIPs: [],
    ports: [
      {
        name: 'http',
        nodePort: 0,
        protocol: 'TCP',
        port: 80,
        targetPort: 8080,
      },
    ],
    selector: {},
  },
  status: {
    loadBalancer: {
      ingress: [],
    },
  },
});

const serviceExternalName: Service = Service.create({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: {
    name: 'external-service',
    namespace: 'default',
    resourceVersion: '12348',
    creationTimestamp: '2022-10-25T11:48:48Z',
    uid: '12347',
  },
  spec: {
    type: 'ExternalName',
    clusterIP: '',
    externalIPs: [],
    externalName: 'example.com',
    ports: [
      {
        name: 'http',
        nodePort: 0,
        protocol: 'TCP',
        port: 80,
        targetPort: 8080,
      },
    ],
    selector: {},
  },
  status: {
    loadBalancer: {
      ingress: [],
    },
  },
});

const pods = [
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'example-pod-1',
      namespace: 'default',
      resourceVersion: '1001',
      creationTimestamp: '2022-10-25T10:00:00Z',
      labels: {
        app: 'example',
      },
    },
    spec: {
      nodeName: 'node-1',
      containers: [
        {
          name: 'main',
          image: 'nginx:latest',
        },
      ],
    },
    status: {
      phase: 'Running',
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'example-pod-2',
      namespace: 'default',
      resourceVersion: '1002',
      creationTimestamp: '2022-10-25T10:05:00Z',
      labels: {
        app: 'example',
      },
    },
    spec: {
      nodeName: 'node-2',
      containers: [
        {
          name: 'main',
          image: 'nginx:latest',
        },
      ],
    },
    status: {
      phase: 'Running',
    },
  },
  {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name: 'example-pod-3',
      namespace: 'default',
      resourceVersion: '1003',
      creationTimestamp: '2022-10-25T10:10:00Z',
      labels: {
        app: 'example',
      },
    },
    spec: {
      nodeName: 'node-1',
      containers: [
        {
          name: 'main',
          image: 'nginx:latest',
        },
      ],
    },
    status: {
      phase: 'Pending',
    },
  },
];

// Generate 25 pods for testing pagination
const largePodList = Array.from({ length: 25 }, (_, i) => ({
  apiVersion: 'v1',
  kind: 'Pod',
  metadata: {
    name: `example-pod-${i + 1}`,
    namespace: 'default',
    resourceVersion: `${1000 + i}`,
    creationTimestamp: '2022-10-25T10:00:00Z',
    labels: {
      app: 'example',
    },
  },
  spec: {
    nodeName: `node-${(i % 3) + 1}`,
    containers: [
      {
        name: 'main',
        image: 'nginx:latest',
      },
    ],
  },
  status: {
    phase: 'Running',
  },
}));

export default {
  title: 'Service/SelectedPods',
  component: SelectedPods,
  decorators: [
    Story => (
      <TestContext>
        <Story />
      </TestContext>
    ),
  ],
} as Meta<typeof SelectedPods>;

const Template: StoryFn<typeof SelectedPods> = args => <SelectedPods {...args} />;

export const WithPods = Template.bind({});
WithPods.args = {
  service: serviceWithSelector,
};
WithPods.parameters = {
  msw: {
    handlers: {
      story: [
        http.get(
          'http://localhost:4466/api/v1/namespaces/default/pods?labelSelector=app%3Dexample',
          () => HttpResponse.json({ kind: 'PodList', items: pods, metadata: {} })
        ),
      ],
    },
  },
};

export const Empty = Template.bind({});
Empty.args = {
  service: serviceWithSelector,
};
Empty.parameters = {
  msw: {
    handlers: {
      story: [
        http.get(
          'http://localhost:4466/api/v1/namespaces/default/pods?labelSelector=app%3Dexample',
          () => HttpResponse.json({ kind: 'PodList', items: [], metadata: {} })
        ),
      ],
    },
  },
};

export const WithPagination = Template.bind({});
WithPagination.args = {
  service: serviceWithSelector,
};
WithPagination.parameters = {
  msw: {
    handlers: {
      story: [
        http.get(
          'http://localhost:4466/api/v1/namespaces/default/pods?labelSelector=app%3Dexample',
          () => HttpResponse.json({ kind: 'PodList', items: largePodList, metadata: {} })
        ),
      ],
    },
  },
};

export const EmptySelector = Template.bind({});
EmptySelector.args = {
  service: serviceWithEmptySelector,
};
EmptySelector.parameters = {
  msw: {
    handlers: {
      story: [
        http.get('http://localhost:4466/api/v1/namespaces/default/pods?labelSelector=', () =>
          HttpResponse.json({ kind: 'PodList', items: pods, metadata: {} })
        ),
      ],
    },
  },
};

export const NoSelector = Template.bind({});
NoSelector.args = {
  service: serviceExternalName,
};
