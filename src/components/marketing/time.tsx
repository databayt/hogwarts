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
        <section className='my-20 rounded-md overflow-hidden'>
            <GradientAnimation
                height="h-auto"
                containerClassName="py-8 md:py-10"
                className="relative z-10 flex items-center justify-center px-6"
            >
                <div className='flex flex-col md:flex-row items-center gap-6 md:gap-12'>
                    <div className='flex flex-col text-center md:text-start'>
                        <h2 className="font-heading font-semibold tracking-tight text-3xl md:text-4xl mb-2 text-white">
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