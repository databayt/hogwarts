import React from 'react'
import Clock from './clock'
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface TimeProps {
    dictionary: Dictionary;
}

const Time = ({ dictionary }: TimeProps) => {
    const timeDict = (dictionary as any).time || { title: 'Time', subtitle: 'We sell the origin of value.' };

    return (
        <section className='flex flex-col items-center py-12 md:py-16 lg:py-20 my-40 bg-blue-500 text-white rounded-md'>
            <div className='flex flex-col items-center text-center px-6'>
                <h1 className="font-heading font-semibold tracking-tight text-4xl md:text-5xl mb-4">
                    {timeDict.title}
                </h1>
                <p className="font-heading text-lg md:text-xl text-white/90 mb-8">
                    {timeDict.subtitle}
                </p>
            </div>
            <div>
                <Clock />
            </div>
        </section>
    )
}

export default Time