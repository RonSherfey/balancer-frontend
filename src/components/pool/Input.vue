<template>
    <div class="pool-input">
        <div
            class="pool-wrapper"
        >
            <div class="pool-meta">
                <PoolIcon
                    class="pool-icon"
                    :address="address"
                />
                <span class="pool-symbol">{{ symbol }}</span>
            </div>
        </div>
        <div class="amount-wrapper">
            <div class="amount">
                <div class="input-wrapper">
                    <div
                        v-if="loading"
                        class="loading"
                    />
                    <input
                        v-else
                        :value="amount"
                        class="input"
                        placeholder="0"
                        type="number"
                        @input="handleInputChange($event.target.value)"
                    >
                    <ButtonText
                        v-if="isMaxLabelShown"
                        :text="'max'"
                        class="max-button"
                        @click="setMax"
                    />
                </div>
                <div
                    class="label"
                    :class="{
                        warning: label.style === LabelStyle.Warning,
                        error: label.style === LabelStyle.Error,
                    }"
                >
                    {{ label.text }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { PropType, defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { ETH_KEY, scale } from '@/utils/helpers';

import ButtonText from '@/components/ButtonText.vue';
import PoolIcon from '@/components/pool/Icon.vue';

export interface Label {
    text: string;
    style: LabelStyle;
}

export enum LabelStyle {
    Normal,
    Warning,
    Error,
}

export default defineComponent({
    components: {
        ButtonText,
        PoolIcon,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
        amount: {
            type: String,
            required: true,
        },
        label: {
            type: Object as PropType<Label>,
            default: {
                text: '',
                style: LabelStyle.Normal,
            },
        },
        loading: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['change'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const symbol = computed(() => {
            const pools = store.state.pools.metadata;
            const pool = pools[props.address];
            if (!pool) {
                return '';
            }
            // return pool.symbol;
            return 'BPT';
        });

        const isMaxLabelShown = computed(() => {
            if (props.address === ETH_KEY) {
                return false;
            }
            const assets = store.getters['assets/metadata'];
            const { balances } = store.state.account;
            if (!balances) {
                return false;
            }
            const balance = balances[props.address];
            const assetMetadata = assets[props.address];
            if (!balance || !assetMetadata) {
                return false;
            }
            return true;
        });

        function setMax(): void {
            const assets = store.getters['assets/metadata'];
            const { balances } = store.state.account;
            const balance = balances[props.address];
            const assetDecimals = assets[props.address].decimals;
            const balanceNumber = new BigNumber(balance);
            const amountNumber = scale(balanceNumber, -assetDecimals);
            const amount = amountNumber.toString();
            handleInputChange(amount);
        }

        function handleInputChange(value: string): void {
            emit('change', value);
        }

        function openModal(): void {
            store.dispatch('ui/openPoolModal');
        }

        return {
            LabelStyle,

            symbol,
            isMaxLabelShown,
            setMax,
            handleInputChange,
            openModal,
        };
    },
});
</script>

<style scoped>
.pool-input {
    display: flex;
    height: 58px;
    border: 1px solid var(--border-input);
    border-radius: var(--border-radius-medium);
    background: var(--background-secondary);
}

.pool-wrapper {
    width: 140px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 5px 0 5px rgba(0, 0, 0, 0.1);
    cursor: pointer;
}

.pool-meta {
    display: flex;
    align-items: center;
}

.pool-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    margin-left: 10px;
}

.pool-symbol {
    max-width: 68px;
    margin-left: 8px;
    font-size: var(--font-size-large);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.amount-wrapper {
    width: 210px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-left: 1px solid var(--border-input);
}

.amount {
    width: 100%;
}

.input-wrapper {
    display: flex;
}

.balance-wrapper {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.loading {
    width: 100px;
    height: 29px;
    background: var(--text-primary);
    animation-name: pulse;
    animation-duration: 2s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}

@keyframes pulse {
    0% {
        opacity: 0.2;
    }

    10% {
        opacity: 0.7;
    }

    100% {
        opacity: 0.2;
    }
}

.input {
    min-width: 120px;
    font-size: var(--font-size-large);
    font-weight: bold;
    color: var(--text-primary);
    border: none;
    background: transparent;
    text-align: left;
    outline: none;
}

.input::placeholder {
    color: var(--text-secondary);
}

.max-button {
    display: flex;
}

.label {
    margin-top: 4px;
    font-size: var(--font-size-tiny);
    color: var(--text-secondary);
}

.label.warning {
    color: var(--warning);
    font-weight: bold;
}

.label.error {
    color: var(--error);
    font-weight: bold;
}

.chevron-icon {
    width: 12px;
    height: 12px;
    margin-right: 10px;
}

@media only screen and (max-width: 768px) {
    .amount-wrapper {
        width: 180px;
    }

    .input {
        min-width: 100px;
    }
}
</style>
