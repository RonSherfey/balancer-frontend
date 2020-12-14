<template>
    <div class="pool-input">
        <div
            class="pool-wrapper"
            @click="openModal"
        >
            <div class="pool-meta">
                <span class="pool-name">{{ getPoolName(pool) }}</span>
            </div>
            <Icon
                class="chevron-icon"
                :title="'chevron'"
            />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { getPoolName } from '@/utils/helpers';
import { RootState } from '@/store';

import Icon from '@/components/Icon.vue';

export default defineComponent({
    components: {
        Icon,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore<RootState>();

        const pool = computed(() => {
            const pools = store.state.pools.metadata;
            return pools[props.address];
        });

        function openModal(): void {
            store.dispatch('ui/openPoolModal');
        }

        return {
            pool,

            getPoolName,

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
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
}

.pool-wrapper.readonly:hover {
    background: var(--background-secondary);
}

.pool-wrapper:hover {
    background: var(--background-hover);
    border-radius: var(--border-radius-medium);
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

.pool-name {
    max-width: 320px;
    margin-left: 8px;
    font-size: var(--font-size-large);
    font-weight: bold;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.chevron-icon {
    width: 12px;
    height: 12px;
    margin-right: 10px;
}
</style>
