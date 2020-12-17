<template>
    <div>
        <div class="pool">
            <div class="header">
                <div class="header-text">
                    Pool
                </div>
                <Settings />
            </div>
            <div>
                <PoolSelector
                    class="pool-selector"
                    :address="poolAddressInput"
                />
            </div>
            <div
                v-for="(asset, i) in assets"
                :key="i"
                class="asset-input"
            >
                <AssetInput
                    :address="assets[i].address"
                    :amount="assetAmountInputs[i]"
                    :label="assetBalances[i]"
                    :modal-key="''"
                    @change="value => {
                        handleAssetAmountChange(i, value);
                    }"
                />
            </div>
            <div class="pool-input">
                <PoolInput
                    :address="poolAddressInput"
                    :amount="poolAmountInput"
                    @change="value => {
                        handlePoolAmountChange(value);
                    }"
                />
            </div>
            <PoolButton
                class="pool-button"
                :transaction-pending="transactionPending"
                :validation="validation"
                @unlock="unlock"
                @invest="invest"
            />
        </div>
        <ModalPoolSelector
            :open="isPoolModalOpen"
            :hidden="[poolAddressInput]"
            @select="handlePoolSelect"
        />
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { ref, defineComponent, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { useIntervalFn } from '@vueuse/core';

import { PoolValidation, ValidationError, validateNumberInput } from '@/utils/validation';
import { scale } from '@/utils/helpers';
import { RootState } from '@/store';
import config from '@/config';

import AssetInput, { LabelStyle } from '@/components/AssetInput.vue';
import ModalPoolSelector from '@/components/pool/ModalSelector.vue';
import Settings from '@/components/Settings.vue';
import PoolButton from '@/components/pool/Button.vue';
import PoolInput from '@/components/pool/Input.vue';
import PoolSelector from '@/components/pool/Selector.vue';

interface Pair {
    assetIn: string;
    assetOut: string;
}

export default defineComponent({
    components: {
        AssetInput,
        ModalPoolSelector,
        Settings,
        PoolButton,
        PoolInput,
        PoolSelector,
    },
    setup() {
        const store = useStore<RootState>();

        const isJoin = ref(true);
        const poolAddressInput = ref('');
        const poolAmountInput = ref('');
        const assetAmountInputs = ref<string[]>([]);
        const transactionPending = ref(false);
        const poolLoading = ref(false);

        const isPoolModalOpen = computed(() => store.state.ui.modal.pool.isOpen);
        const isAssetModalOpen = computed(() => store.state.ui.modal.asset.isOpen);
        
        const account = computed(() => {
            const { connector, address } = store.state.account;
            if (!connector || !connector.id || !address) {
                return '';
            }
            return address;
        });

        const pool = computed(() => {
            const pools = store.state.pools.metadata;
            const pool = pools[poolAddressInput.value];
            return pool;
        });

        const assets = computed(() => {
            if (!pool.value) {
                return [];
            }
            return pool.value.assets;
        });

        const assetBalances = computed(() => {
            return assets.value.map(asset => {
                // const assetIndex = assets.value.indexOf(asset);
                const { balances } = store.state.account;
                const metadata = store.getters['assets/metadata'];
                if (!balances || !metadata) {
                    return {
                        text: '',
                        style: LabelStyle.Normal,
                    };
                }

                const assetMetadata = metadata[asset.address];
                const balance = balances[asset.address];
                if (!assetMetadata || !balance) {
                    return {
                        text: '',
                        style: LabelStyle.Normal,
                    };
                }

                const balanceNumber = new BigNumber(balance);
                const assetDecimals = assetMetadata.decimals;
                const balanceShortNumber = scale(balanceNumber, -assetDecimals);
                const text = `Balance: ${balanceShortNumber.toFixed(config.precision)}`;
                // const amount = assetAmountInputs.value[assetIndex];
                //     ? assetAmountInputs.value[assetIndex]
                //     : '';
                const amount = '';
                const error = validateNumberInput(amount);
                const style = error == ValidationError.NONE && balanceShortNumber.lt(amount)
                    ? LabelStyle.Error
                    : LabelStyle.Normal;
                return {
                    text,
                    style,
                };
            });
        });

        const validation = computed(() => {
            // Invalid input
            const inputError = validateNumberInput(activeInput.value);
            if (inputError === ValidationError.EMPTY) {
                return PoolValidation.EMPTY_INPUT;
            }
            if (inputError !== ValidationError.NONE) {
                return PoolValidation.INVALID_INPUT;
            }
            // No account
            if (!account.value) {
                return PoolValidation.NO_ACCOUNT;
            }
            // Wrong network
            const { chainId } = store.state.account;
            if (config.chainId !== chainId) {
                return PoolValidation.WRONG_NETWORK;
            }
            // Insufficient balance
            const { balances } = store.state.account;
            const metadata = store.getters['assets/metadata'];
            for (const asset of assets.value) {
                const assetBalance = balances[asset.address];
                const assetMetadata = metadata[asset.address];
                if (!assetMetadata) {
                    console.log('validation: no meta', asset.address);
                    return PoolValidation.INSUFFICIENT_BALANCE;
                }
                const assetDecimals = assetMetadata.decimals;
                const assetAmountRaw = assetAmountInputs.value[assets.value.indexOf(asset)];
                const assetAmountRawNumber = new BigNumber(assetAmountRaw);
                const assetAmountNumber = scale(assetAmountRawNumber, assetDecimals);
                console.log('validation', assetBalance, assetAmountNumber.toString(), assetAmountNumber.gt(assetBalance));
                if (!assetBalance || assetAmountNumber.gt(assetBalance)) {
                    return PoolValidation.INSUFFICIENT_BALANCE;
                }
            }
            return PoolValidation.NONE;
        });

        const activeInput = computed(() => poolAmountInput.value);

        onMounted(async () => {
            const poolAddress = getInitialPool();
            poolAddressInput.value = poolAddress;
            assetAmountInputs.value = pool.value.assets.map(() => '');
            store.dispatch('pools/fetchBalances', poolAddress);
        });

        useIntervalFn(async () => {
            const assets = Object.keys(store.getters['assets/metadata']);
            store.dispatch('account/fetchAssets', assets);
        }, 5 * 60 * 1000);

        function handleAssetAmountChange(index: number, amount: string): void {
            console.log('handleAssetAmountChange', index, amount);
            // update asset amounts
            const decimals = assets.value[index].decimals;
            const balance = assets.value[index].balance;
            const balanceNumber = new BigNumber(balance);
            const amountNumber = new BigNumber(amount);
            const amountRawNumber = scale(amountNumber, decimals);
            const ratio = amountRawNumber.div(balanceNumber);
            for (let i = 0; i < assets.value.length; i++) {
                if (i == index) {
                    continue;
                }
                const decimals = assets.value[i].decimals;
                const balance = assets.value[i].balance;
                const balanceNumber = new BigNumber(balance);
                const amountRaw = balanceNumber.times(ratio);
                const amount = scale(amountRaw, -decimals);
                console.log(i, amount.toString());
                assetAmountInputs.value[i] = amount.toString();
            }
            // update pool amount
            const totalSupply = pool.value.totalSupply;
            const totalSupplyNumber = new BigNumber(totalSupply);
            const poolAmountRaw = totalSupplyNumber.times(ratio);
            const poolAmount = scale(poolAmountRaw, -18);
            poolAmountInput.value = poolAmount.toString();
        }

        function handlePoolAmountChange(amount: string): void {
            console.log('handlePoolAmountChange', amount);
            // update asset amounts
            const totalSupply = pool.value.totalSupply;
            const totalSupplyNumber = new BigNumber(totalSupply);
            const amountNumber = new BigNumber(amount);
            const amountRawNumber = scale(amountNumber, 18);
            const ratio = amountRawNumber.div(totalSupplyNumber);
            for (let i = 0; i < assets.value.length; i++) {
                const decimals = assets.value[i].decimals;
                const balance = assets.value[i].balance;
                const balanceNumber = new BigNumber(balance);
                const amountRaw = balanceNumber.times(ratio);
                const amount = scale(amountRaw, -decimals);
                console.log(i, amount.toString());
                assetAmountInputs.value[i] = amount.toString();
            }
        }

        function handlePoolSelect(poolAddress: string): void {
            poolAddressInput.value = poolAddress;
            assetAmountInputs.value = pool.value.assets.map(() => '');
            store.dispatch('pools/fetchBalances', poolAddress);
        }

        function unlock(): void {

        }

        function invest(): void {

        }

        // async function handleTransaction(transaction: any, text: string): Promise<void> {
        //     if (transaction.code) {
        //         transactionPending.value = false;
        //         if (transaction.code === ErrorCode.UNPREDICTABLE_GAS_LIMIT) {
        //             store.dispatch('ui/notify', {
        //                 text: `${text} failed`,
        //                 type: 'warning',
        //                 link: 'https://help.balancer.finance',
        //             });
        //         }
        //         return;
        //     }

        //     store.dispatch('account/saveTransaction', {
        //         transaction,
        //         text,
        //     });

        //     const transactionReceipt = await provider.waitForTransaction(transaction.hash, 1);
        //     transactionPending.value = false;
        //     store.dispatch('account/saveMinedTransaction', {
        //         receipt: transactionReceipt,
        //         timestamp: Date.now(),
        //     });

        //     const type = transactionReceipt.status === 1
        //         ? 'success'
        //         : 'error';
        //     const link = getEtherscanLink(transactionReceipt.transactionHash);
        //     store.dispatch('ui/notify', {
        //         text,
        //         type,
        //         link,
        //     });
        // }

        // async function fetchAssetMetadata(assetIn: string, assetOut: string): Promise<void> {
        //     const metadata = store.getters['assets/metadata'];
        //     const unknownAssets = [];
        //     if (!metadata[assetIn]) {
        //         unknownAssets.push(assetIn);
        //     }
        //     if (!metadata[assetOut]) {
        //         unknownAssets.push(assetOut);
        //     }
        //     if (unknownAssets.length === 0) {
        //         return;
        //     }
        //     await store.dispatch('assets/fetchMetadata', unknownAssets);
        //     await store.dispatch('account/fetchAssets', unknownAssets);
        // }

        function getInitialPool(): string {
            const poolMetadata = store.state.pools.metadata;
            return Object.keys(poolMetadata)[0];
        }

        return {
            isJoin,
            poolAddressInput,
            poolAmountInput,
            assets,
            assetAmountInputs,
            assetBalances,

            validation,

            account,
            transactionPending,
            poolLoading,
            isPoolModalOpen,
            isAssetModalOpen,

            handleAssetAmountChange,
            handlePoolAmountChange,
            handlePoolSelect,
            unlock,
            invest,
        };
    },
});
</script>

<style scoped>
.pool {
    margin: 20px;
    padding: 40px 40px;
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-form);
    border-radius: var(--border-radius-large);
    background: var(--background-form);
}

.header {
    width: 100%;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
}

.header-text {
    font-size: var(--font-size-header);
}

.pool-selector {
    margin-bottom: 40px;
}

.asset-input {
    margin: 4px 0;
}

.pool-input {
    margin-top: 8px;
}

.validation-message {
    margin-top: 16px;
    min-height: 16.5px;
    font-size: 14px;
    color: var(--error);
}

.status-label {
    margin-top: 32px;
    font-size: 14px;
}

.pool-button {
    margin-top: 40px;
    width: 100%;
}

@media only screen and (max-width: 768px) {
    .pair {
        margin: 0;
        padding: 16px 8px;
        border: none;
        background: transparent;
    }

    .routing {
        max-width: initial;
        width: 100%;
    }
}
</style>
