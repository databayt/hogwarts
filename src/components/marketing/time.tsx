import React from 'react'
import Clock from './clock'
import { GradientAnimation } from '@/components/atom/gradient-animation'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimeProps {
    dictionary: Dictionary;
}

const Time = ({ dictionary }: TimeProps) => {
    const timeDict = (dictionary as any).time || { title: 'Time', subtitle: 'We sell the origin of value.' };

    return (
        <section>
            <GradientAnimation
                height="h-auto"
                containerClassName="py-16 md:py-20 !w-full rounded-xl"
                className="relative z-10 flex items-center justify-center"
            >
                <div className='flex flex-col md:flex-row items-center gap-6 md:gap-12 px-6 md:px-14'>
                    <div className='flex flex-col text-center md:text-start'>
                        <h2 className="font-heading font-extrabold tracking-tight text-4xl md:text-5xl mb-2 text-white">
                            {timeDict.title}
                        </h2>
                        <p className="font-heading text-base md:text-lg text-white/90">
                            {timeDict.subtitle}
                        </p>
                    </div>
                    <div>
                        <Clock />
                    </div>
                </div>
            </GradientAnimation>
        </section>
    )
}

export default Time