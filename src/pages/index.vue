<script setup lang="ts">
import { useGsapContext } from '@/hooks/useGsapContext'
import { animate, scrambleText } from 'animejs'

defineOptions({ name: 'Index' })
definePage({ meta: { index: 10 } })

useGsapContext('.index', () => {
  gsap.timeline({ delay: 0.5 })
})

const test = () => {
  animate('[t1]', {
    innerHTML: scrambleText({ text: '山外青山楼外楼，', chars: 'blocks' }),
  })
  animate('[t2]', {
    innerHTML: scrambleText({
      text: '西湖歌舞几时休？西湖歌舞几时休？西湖歌舞几时休？',
      chars: 'blocks',
      revealRate: 100,
    }),
  })
  animate('[t3]', {
    innerHTML: scrambleText({
      text: '暖风熏得游人醉，',
      chars: 'braille',
    }),
  })
  animate('[t4]', {
    innerHTML: scrambleText({
      override: '',
      chars: 'shades',
      text: '交交桑扈，有莺其羽。君子乐胥，受天之祜。 交交桑，有莺其领。君子乐，万邦之屏。之屏之翰，百辟为宪。不戢不难，受福不那。 兕觥其觩，旨酒思柔。彼交匪敖，万福来求。',
    }),
  })
  animate('[t5]', {
    innerHTML: scrambleText({
      override: '',
      chars: 'blocks',
      text: '交交桑扈，有莺其羽。君子乐胥，受天之祜。',
      revealRate: 1,
      perturbation: 1,
      duration: 1000,
    }),
  })
}
</script>

<template>
  <div class="size-full">
    <section class="scroll-box index" @click="test">
      <main class="content center">
        <div class="space-y-30 font-mono">
          <div class="min-h-[1em] text-center" t1></div>
          <div class="text-green min-h-[1em] text-center" t2></div>
          <div class="text-blue min-h-[1em] text-center" t3></div>

          <div t5 class="text-purple min-h-[1em] px-60 text-center font-mono leading-normal"></div>
          <div t4 class="text-purple min-h-[1em] px-60 text-left font-mono leading-normal"></div>
        </div>
      </main>
    </section>
  </div>
</template>
