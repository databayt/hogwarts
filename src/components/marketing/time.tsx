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
                height="h-[280px] md:h-[240px]"
                containerClassName="!w-full rounded-xl overflow-hidden"
            >
                <div className='absolute z-50 inset-0 flex items-center'>
                    <div className='flex flex-col md:flex-row items-center justify-between w-full px-8 md:px-16 gap-8'>
                        <div className='flex flex-col text-center md:text-start'>
                            <h2 className="font-heading font-black tracking-tight text-5xl md:text-7xl mb-3 text-white">
                                {timeDict.title}
                            </h2>
                            <p className="font-heading text-lg md:text-xl text-white/90">
                                {timeDict.subtitle}
                            </p>
                        </div>
                        <div className='flex-shrink-0'>
                            <Clock />
                        </div>
                    </div>
                </div>
            </GradientAnimation>
        </section>
    )
}

export default Time