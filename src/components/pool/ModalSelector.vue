<template>
    <ModalBase
        :title="'Select Pool'"
        :open="open"
        @close="close"
    >
        <template #default>
            <div class="query-input-wrapper">
                <input
                    v-model="query"
                    v-autofocus
                    class="query-input"
                    placeholder="Search by symbol, name, or asset"
                >
            </div>
            <div
                v-for="pool in visiblePools"
                :key="pool.address"
                class="pool"
                @click="select(pool.address)"
            >   
                <div class="pool-meta">
                    <PoolIcon
                        class="pool-icon"
                        :address="pool.address"
                    />
                    <div class="pool-name">
                        {{ getPoolName(pool) }}
                    </div>
                </div>
            </div>
        </template>
    </ModalBase>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useStore } from 'vuex';

import { isAddress, getPoolName } from '@/utils/helpers';
import { RootState } from '@/store';

import PoolIcon from '@/components/pool/Icon.vue';
import ModalBase from '@/components/ModalBase.vue';

export default defineComponent({
    components: {
        PoolIcon,
        ModalBase,
    },
    props: {
        open: {
            type: Boolean,
            required: true,
        },
        hidden: {
            type: Array,
            default: (): any[] => [],
        },
    },
    emits: ['select'],
    setup(props, { emit }) {
        const store = useStore<RootState>();

        const query = ref('');

        const pools = computed(() => {
            const metadata = store.state.pools.metadata;
            return Object.values(metadata).slice(0, 100);
        });

        const visiblePools = computed(() => {
            return pools.value
                .filter(pool => {
                    // Filter by "hidden" prop
                    if (props.hidden.includes(pool.address)) {
                        return false;
                    }
                    // Filter by query
                    const queryString = query.value.toLowerCase();
                    if (!queryString) {
                        return true;
                    }
                    if (isAddress(queryString)) {
                        return pool.address.toLowerCase() === queryString;
                    }
                    return false;
                });
        });

        function select(assetAddress: string): void {
            emit('select', assetAddress);
            close();
        }

        function close(): void {
            query.value = '';
            store.dispatch('ui/closePoolModal');
        }

        return {
            query,
            visiblePools,

            getPoolName,

            select,
            close,
        };
    },
});
</script>

<style scoped>
.query-input-wrapper {
    padding: 16px;
}

.query-input {
    width: 100%;
    font-size: 16px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    outline: none;
}

.pool {
    display: flex;
    justify-content: space-between;
    padding: 16px;
    border-bottom: 1px solid var(--border-input);
    cursor: pointer;
}

.pool:hover {
    background: var(--border-input);
}

.pool-meta {
    display: flex;
    align-items: center;
}

.pool-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
}

.pool-name {
    max-width: 360px;
    padding-left: 12px;
    font-size: var(--font-size-large);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.pool-amount {
    display: flex;
    align-items: center;
    color: var(--text-secondary);
    font-size: var(--font-size-large);
}
</style>
