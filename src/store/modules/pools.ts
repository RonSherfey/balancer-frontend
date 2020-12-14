import BigNumber from 'bignumber.js';
import { ActionContext } from 'vuex';

import pools from '@/pools.json';
import { getTrustwalletLink } from '@/utils/helpers';
import { RootState } from '@/store';
import { AssetMetadata } from '@/config';

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
}

interface PoolAsset extends AssetMetadata {
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
    assets: PoolAsset[];
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
                        logoURI: getTrustwalletLink(token.address),
                    };
                });
                return [pool.id, {
                    address: pool.id,
                    finalized: true,
                    swapFee: new BigNumber(pool.swapFee),
                    totalWeight: new BigNumber(pool.totalWeight),
                    assets,
                }];
            }),
        );
        commit('addMetadata', poolMetadata);
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
