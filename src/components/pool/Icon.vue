<template>
    <span
        class="pie border circle border-black-fade d-inline-block"
    >
        <svg
            height="100%"
            width="100%"
            viewBox="0 0 20 20"
        >
            <circle
                v-for="(item, i) in dataObjects"
                :key="i"
                :style="{
                    strokeDasharray: `${item.relativeSize} ${CIRCLE_LENGTH}`,
                    strokeDashoffset: item.offset
                }"
                r="5"
                cx="10"
                cy="10"
                fill="transparent"
                :stroke="COLORS[i]"
                :stroke-offset="item.offset"
                stroke-width="10"
                transform="rotate(-90) translate(-20)"
            />
        </svg>
    </span>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';

import { RootState } from '@/store';

const CIRCLE_LENGTH = 10 * Math.PI;

const COLORS = [
    '#5d6872',
    '#7e9e99',
    '#9d9f7f',
    '#68aca9',
    '#a593a5',
    '#387080',
    '#c7bdf4',
    '#c28d75',
    '#be955c',
    '#8d6268',
    '#416aa3',
    '#6f6776',
    '#557064',
    '#6e6962',
    '#6eaa78',
    '#93a167',
    '#220730',
    '#9a4f50',
    '#666092',
    '#c38890',
    '#8b5580',
    '#c5ccb8',
    '#9a9a97',
    '#5d2e9a',
    '#433455',
    '#7ca1c0',
    '#628b8d',
];

export default defineComponent({
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    setup(props) {
        const store = useStore<RootState>();

        const weights = computed(() => {
            const address = props.address;
            const metadata = store.state.pools.metadata;
            const pool = metadata[address];
            if (!pool) {
                return [];
            }
            return pool.assets.map(asset => asset.weight);
        });

        const totalWeight = computed(() => weights.value.reduce((a, b) => a.plus(b)));

        const dataObjects = computed(() => {
            let startingPoint = new BigNumber(0);
            return weights.value.map(weight => {
                const relativeSize = weight.div(totalWeight.value).times(CIRCLE_LENGTH);
                const dataObject = {
                    relativeSize,
                    offset: -startingPoint.toNumber(),
                };
                startingPoint = startingPoint.plus(relativeSize);
                return dataObject;
            });
        });

        return {
            CIRCLE_LENGTH,
            COLORS,
            dataObjects,
        };
    },
});
</script>
