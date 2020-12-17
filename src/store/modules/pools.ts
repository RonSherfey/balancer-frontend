import BigNumber from 'bignumber.js';
import { ActionContext } from 'vuex';

import pools from '@/pools.json';
import { getTrustwalletLink } from '@/utils/helpers';
import { RootState } from '@/store';
import { AssetMetadata } from '@/config';
import Ethereum from '@/api/ethereum';

interface PoolListItem {
    id: string;
    swapFee: string;
    totalWeight: string;
    tokens: {
        address: string;
        decimals: number;
        denormWeight: string;
        name: string;
        symbol: string;
    }[];
    name?: string;
}

interface PoolAsset extends AssetMetadata {
    balance: BigNumber;
    weight: BigNumber;
}

export interface BasePoolMetadata {
    address: string;
    assets: string[];
}

export interface PoolMetadata {
    address: string;
    finalized: boolean;
    swapFee: BigNumber;
    totalWeight: BigNumber;
    totalSupply: BigNumber;
    assets: PoolAsset[];
    name?: string;
}

export interface PoolState {
    metadata: Record<string, PoolMetadata>;
}

const mutations = {
    addMetadata: (_state: PoolState, metadata: Record<string, PoolMetadata>): void => {
        for (const address in metadata) {
            _state.metadata[address] = metadata[address];
        }
    },
};

const actions = {
    init: async({ commit }: ActionContext<PoolState, RootState>): Promise<void> => {
        const poolList = pools as PoolListItem[];

        const poolMetadata = Object.fromEntries(
            poolList.map(pool => {
                const assets = pool.tokens.map(token => {
                    return {
                        address: token.address,
                        name: token.name,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        weight: new BigNumber(token.denormWeight),
                        balance: new BigNumber(0),
                        logoURI: getTrustwalletLink(token.address),
                    };
                });
                const metadata: PoolMetadata = {
                    address: pool.id,
                    finalized: true,
                    swapFee: new BigNumber(pool.swapFee),
                    totalWeight: new BigNumber(pool.totalWeight),
                    totalSupply: new BigNumber(0),
                    assets,
                    name: pool.name,
                };
                return [pool.id, metadata];
            }),
        );
        commit('addMetadata', poolMetadata);
    },
    fetchBalances: async({ state, commit }: ActionContext<PoolState, RootState>, poolAddress: string): Promise<void> => {
        console.log('[store/pools] fetchBalances', poolAddress);
        const pool = state.metadata[poolAddress];
        const poolBalances = await Ethereum.fetchPoolBalances([pool]);
        console.log('[store/pools] fetchBalances res', poolBalances);
        commit('addMetadata', poolBalances);
    },
};

function state(): PoolState {
    return {
        metadata: {},
    };
}

export default {
    namespaced: true,
    state,
    actions,
    mutations,
};
