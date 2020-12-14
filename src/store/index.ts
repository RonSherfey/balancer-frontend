import { createStore } from 'vuex';

import account, { AccountState } from './modules/account';
import assets, { AssetState } from './modules/assets';
import pools, { PoolState } from './modules/pools';
import ui, { UIState } from './modules/ui';

export interface RootState {
	account: AccountState;
	assets: AssetState;
	pools: PoolState;
	ui: UIState;
}

const store = createStore({
    modules: {
        account,
        assets,
        pools,
        ui,
    },
});

export default store;
