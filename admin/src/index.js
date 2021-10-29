import React from 'react';

const App = () => {
  return (
    <div><h1>CFP App admin interface coming soon</h1></div>
  );
};


import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import lifecycles from './lifecycles';

export default strapi => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;
  const icon = pluginPkg.strapi.icon;
  const name = pluginPkg.strapi.name;

  const trads = {};

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon,
    id: pluginId,
    initializer: () => null,
    injectedComponents: [],
    isReady: true,
    isRequired: pluginPkg.strapi.required || false,
    layout: null,
    lifecycles,
    mainComponent: App,
    name,
    preventComponentRendering: false,
    trads,
    menu: {
      pluginsSectionLinks: [
        {
          destination: `/plugins/${pluginId}`,
          icon,
          label: {
            id: `${pluginId}.plugin.name`,
            defaultMessage: name,
          },
          name,
          permissions: [],
        },
      ],
    },
    settings: {
      menuSection: {
        id: pluginId,
        title: 'CFP',
        links: [],
      },
    },

  };

  return strapi.registerPlugin(plugin);
};
