import React from 'react';
import uuid from 'uuid/v4';
import classnames from 'classnames';
import './App.css';

const Image = ( ) => {
  return (
    <img src="https://placehold.it/400x200" alt="Placeholder" />
  );
}

const Heading = ( { attributes } ) => {
  return (
    <h2>{ attributes.content }</h2>
  );
}

const Paragraph = ( { attributes } ) => {
  return (
    <h2>{ attributes.content }</h2>
  );
}

const Group = ( { children } ) => {
  return (
    <BlockList blocks={ children } />
  );
}

const MediaText = ( { attributes, children } ) => {
  const { stack } = attributes;
  return (
    <div className={ [ 'media-text', stack && 'stack' ].join( ' ' ) }>
      <Image />
      <BlockList blocks={ children } />
    </div>
  );
}

const Block = ( props ) => {
  const {
    clientId,
    className,
    children,
  } = props;

  const { store: selectedId, dispatch } = React.useContext(Context)
  const parents = getBlockParents( clientId );
  const block = getBlock( clientId );

  const hasChildren = !! block.children;
  const hasParent = !! parents[0];
  const isSelected = selectedId && selectedId === clientId;
  const isParentSelected = selectedId && selectedId === parents[0];
  const isAncestorSelected = selectedId && parents.includes( selectedId );

  const selectionClass = isSelected
    ? hasChildren ? 'selectedParent' : 'selectedLeaf'
    : hasParent
      ? isParentSelected
        ? 'childOfSelected'
        : isAncestorSelected
          ? 'neutral'
          : hasChildren ? 'neutral' : 'full'
      : hasChildren ? 'neutral' : 'full';

  const classes = classnames(
    className,
    selectionClass,
  );

  const onClick = ( event ) => {
    dispatch( selectBlock( clientId ) );
    event.stopPropagation();
  };

  return (
    <div
      className={ classes }
      onClick={ onClick }
    >
      { children }
    </div>
  );
}

const BlockList = ( { blocks } ) => {
  return (
    <div className='block-list'>
      {
        blocks.map( ( block, index ) => {
          const {
            constructor: BlockEdit,
            clientId,
            ...props
          } = block;

          return (
            <Block
              key={ index }
              className={ 'block ' + BlockEdit.name }
              clientId={ clientId }
            >
              <BlockEdit { ...props } />
            </Block>
          );
        } )
      }
    </div>
  )
}

const block = ( constructor, attributes = {}, children ) => {
  const clientId = uuid();
  return {
    clientId,
    constructor,
    attributes,
    children,
  };
};

const blocks = [
  block( Heading, { content: 'An image' } ),
  block( Image ),
  block( Group, {}, [
    block( Heading, { content: 'Group 1' } ),
    block( MediaText, {}, [
      block( Heading, { content: 'Media & Text 1' } ),
      block( Paragraph, { content: 'Some other text' } ),
    ] ),
    block( Group, {}, [
      block( Heading, { content: 'Group 1.1' } ),
    ] ),
  ] ),
  block( Group, {}, [
    block( Heading, { content: 'Group 2' } ),
    block( MediaText, { stack: true }, [
      block( Heading, { content: 'Media & Text 2' } ),
      block( Paragraph, { content: 'Some other text' } ),
    ] ),
    block( Group, {}, [
      block( Heading, { content: 'Group 2.1' } ),
      block( Group, {}, [
        block( Heading, { content: 'Group 2.1.1' } ),
      ] ),
      ] ),
    block( Group, {}, [
      block( Heading, { content: 'Group 2.2' } ),
    ] ),
  ] ),
];

window.blocks = blocks;

function selectBlock( clientId ) {
  return {
    type: 'SELECT_BLOCK',
    clientId,
  }
}

const Context = React.createContext()

function mapBlockParents( blocks, rootClientId = '' ) {
  if ( blocks === undefined ) {
    return {}
  }

  return blocks.reduce( ( result, block ) => Object.assign(
		result,
		{ [ block.clientId ]: rootClientId },
		mapBlockParents( block.children, block.clientId )
	), {} );
}
const parents = mapBlockParents( blocks );
blocks.parents = parents;

function getBlockParents( clientId ) {
  const parents = [];
  let current = clientId;
  while ( !! blocks.parents[ current ] ) {
    current = blocks.parents[ current ];
    parents.push( current );
  }

  return parents;
}

function flattenBlocks( blocks ) {
	const result = {};

	const stack = [ ...blocks ];
	while ( stack.length ) {
    const block = stack.shift();
    const { children = [] } = block;
		stack.push( ...children );
		result[ block.clientId ] = block;
	}

	return result;
}
blocks.byClientId = flattenBlocks( blocks );

function getBlock( clientId ) {
  return blocks.byClientId[clientId];
}

function Rulers() {
  return (
    <div className='rulers'>
      <div className="ruler-edges"></div>
      <div className="ruler-selected"></div>
      <div className="ruler-selected-children"></div>
      <div className="ruler-content"></div>
    </div>
  );
}

function App() {
  const [ store, dispatch ] = React.useReducer(
    ( state, action ) => {
      switch ( action.type ) {
        case 'SELECT_BLOCK':
          console.log( 'Selected:', action.clientId );
          return action.clientId;
        default:
          return state;
      }
    },
    undefined,
  )
  return (
    <div className="App">
      <Context.Provider value={ { store, dispatch } }>
        <Rulers />
        <BlockList blocks={ blocks } />
      </Context.Provider>
    </div>
  );
}

export default App;