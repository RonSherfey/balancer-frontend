<template>
    <Button
        :disabled="disabled"
        :text="text"
        :primary="true"
        :loading="loading"
        @click="handleClick"
    />
</template>

<script lang="ts">
import { PropType, defineComponent, toRefs, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';
import { PoolValidation } from '@/utils/validation';

import Button from '@/components/Button.vue';

enum Type {
    Connect,
    Unlock,
    Invest,
}

export default defineComponent({
    components: {
        Button,
    },
    props: {
        transactionPending: {
            type: Boolean,
            required: true,
        },
        validation: {
            type: Number as PropType<PoolValidation>,
            required: true,
        },
    },
    emits: ['invest', 'unlock'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const { transactionPending, validation } = toRefs(props);

        const account = computed(() => {
            const { connector, address } = store.state.account;
            if (!connector || !connector.id || !address) {
                return '';
            }
            return address;
        });

        const type = computed(() => {
            if (!account.value) {
                return Type.Connect;
            }
            if (!isUnlocked.value) {
                return Type.Unlock;
            } else {
                return Type.Invest;
            }
        });

        const disabled = computed(() => {
            if (type.value === Type.Connect) {
                const { connector, address } = store.state.account;
                return !!connector && !!connector.id && !address;
            } else {
                return validation.value !== PoolValidation.NONE ||
                    transactionPending.value;
            }
        });

        const text = computed(() => {
            if (loading.value) {
                return actionText.value;
            }
            if (disabled.value) {
                return errorText.value;
            } else {
                return actionText.value;
            }
        });

        const loading = computed(() => {
            if (type.value === Type.Connect) {
                const { connector, address } = store.state.account;
                return !!connector && !!connector.id && !address;
            } else {
                return transactionPending.value;
            }
        });

        const errorText = computed(() => {
            if (validation.value === PoolValidation.EMPTY_INPUT) {
                return 'Enter amount';
            }
            if (validation.value === PoolValidation.INVALID_INPUT) {
                return 'Invalid amount';
            }
            if (validation.value === PoolValidation.WRONG_NETWORK) {
                return 'Wrong network';
            }
            if (validation.value === PoolValidation.INSUFFICIENT_BALANCE) {
                return 'Not enough funds';
            }
            return '';
        });

        const actionText = computed(() => {
            if (type.value === Type.Connect) {
                return 'Connect Wallet';
            }
            if (type.value === Type.Unlock) {
                return 'Unlock';
            }
            if (type.value === Type.Invest) {
                return 'Invest';
            }
            return '';
        });

        const isUnlocked = computed(() => {
            return true;
            // const { allowances } = store.state.account;
            // const metadata = store.getters['assets/metadata'];
            // if (!addressIn.value) {
            //     return true;
            // }
            // if (addressIn.value === ETH_KEY) {
            //     return true;
            // }
            // if (!amountIn.value) {
            //     return true;
            // }
            // const exchangeProxyAddress = config.addresses.exchangeProxy;
            // if (!allowances[exchangeProxyAddress]) {
            //     return true;
            // }
            // const allowance = allowances[exchangeProxyAddress][addressIn.value];
            // if (!allowance) {
            //     return true;
            // }
            // const decimals = metadata[addressIn.value].decimals;
            // if (!decimals) {
            //     return true;
            // }
            // const allowanceNumber = new BigNumber(allowance);
            // const allowanceRaw = scale(allowanceNumber, -decimals);
            // return allowanceRaw.gte(amountIn.value);
        });

        function handleClick(): void {
            if (type.value === Type.Connect) {
                store.dispatch('ui/openConnectorModal');
            } else if (type.value === Type.Unlock) {
                emit('unlock');
            } else {
                emit('invest');
            }
        }

        return {
            disabled,
            text,
            loading,
            handleClick,
        };
    },
});
</script>
