import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers'
import Reactotron from 'reactotron-react-native'
import {
  applyMiddleware,
  compose,
  createStore,
  Middleware,
  StoreEnhancer
} from 'redux'
import createSagaMiddleware from 'redux-saga'
import Config from '../Config/DebugConfig'
import ReduxPersist from '../Config/ReduxPersist'
import Rehydration from '../Services/Rehydration'
import StoreState from '../Types/StoreState'
import ScreenTracking from './ScreenTrackingMiddleware'

// creates the store
export default (rootReducer, rootSaga) => {
  /* ------------- Redux Configuration ------------- */

  const middleware: Middleware[] = []
  const enhancers: StoreEnhancer[] = []

  /* ------------- Navigation Middleware ------------ */
  const navigationMiddleware = createReactNavigationReduxMiddleware(
    (state: StoreState) => state.nav
  )
  middleware.push(navigationMiddleware)

  /* ------------- Analytics Middleware ------------- */
  middleware.push(ScreenTracking)

  /* ------------- Saga Middleware ------------- */

  const sagaMonitor = Config.useReactotron
    ? console.tron.createSagaMonitor()
    : null
  const sagaMiddleware = createSagaMiddleware({ sagaMonitor })
  middleware.push(sagaMiddleware)

  /* ------------- Assemble Middleware ------------- */

  enhancers.push(applyMiddleware(...middleware))

  if (Config.useReactotron) {
    enhancers.push(console.tron.createEnhancer())
  }

  // if Reactotron is enabled (default for __DEV__), we'll create the store through Reactotron
  const store = createStore(rootReducer, compose(...enhancers))

  // configure persistStore and check reducer version number
  if (ReduxPersist.active) {
    Rehydration.updateReducers(store)
  }

  // kick off root saga
  const sagasManager = sagaMiddleware.run(rootSaga)

  return {
    store,
    sagasManager,
    sagaMiddleware
  }
}