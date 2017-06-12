const path = require('path');
const fs = require('fs');
const express = require('express');

import React from 'react'
import { renderToString } from 'react-dom/server'

import { Router, RouterContext, match } from 'react-router';
import routes from './src/routes/index.js';

import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import { combineReducers } from 'redux';

const combinedReducers = combineReducers({}); 

import fetchComponentData from './fetchComponentData.js';

const finalCreateStore = applyMiddleware()( createStore );

const app = express();
// "url": "https://github.com/coodoo/react-redux-isomorphic-example"
// const open = require('open');
// open('http://localhost:7001');

app.use('/', express.static(__dirname + '/dist'));


app.use( ( req, res, next ) => {
    const store = finalCreateStore(combinedReducers);

    // react-router
	match( {routes, location: req.url}, ( error, redirectLocation, renderProps ) => {

		if ( error )
			return res.status(500).send( error.message );

		if ( redirectLocation )
			return res.redirect( 302, redirectLocation.pathname + redirectLocation.search );

		if ( renderProps == null ) {
			// return next('err msg: route not found'); // yield control to next middleware to handle the request
			return res.status(404).send( 'Not found' );
		}

		fetchComponentData( store.dispatch, renderProps.components, renderProps.params)

		.then( () => {

			const initView = renderToString((
				<Provider store={store}>
				  <RouterContext {...renderProps} />
				</Provider>
			))

			// console.log('\ninitView:\n', initView);

			let state = JSON.stringify( store.getState() );
			// console.log( '\nstate: ', state )

			let page = renderFullPage( initView, state )
			// console.log( '\npage:\n', page );

			return page;

		})

		.then( page => res.status(200).send(page) )

		.catch( err => res.end(err.message) );
	})

    
})

function renderFullPage(html, initialState) {
  return `
	<!doctype html>
	<html lang="utf-8">
	  <head>
		<title>Universal Redux Example</title>
		<link rel="shortcut icon" type="image/png" href="assets/images/react.png">
		<link rel="stylesheet" href="/assets/css/uikit.almost-flat.min.css">
	  </head>
	  <body>
	  <div class="container">${html}</div>
		<script>window.$REDUX_STATE = ${initialState}</script>
		<script src="/js/bundle.js"></script>
	  </body>
	</html>
	`
}

// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist/index.html'));
// });

// example of handling 404 pages
app.get('*', function(req, res) {
	res.status(404).send('Server.js > 404 - Page Not Found');
})

// global error catcher, need four arguments
app.use((err, req, res, next) => {
  console.error("Error on request %s %s", req.method, req.url);
  console.error(err.stack);
  res.status(500).send("Server error");
});

process.on('uncaughtException', evt => {
  console.log( 'uncaughtException: ', evt );
})

app.listen(7001, 'localhost', (err) => {
    if (err) {
        console.log(err);
        return;
    }

    console.log('Listening at http://localhost:7001');
});

