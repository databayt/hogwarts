import { InfiniteSlider } from '@/components/atom/infinite-slider'
import { ProgressiveBlur } from '@/components/atom/progressive-blur'

export default function LogoCloud() {
    return (
        <section className="py-16 md:py-24 overflow-hidden">
                <div className="flex flex-col items-center md:flex-row">
                    <div className="md:max-w-44 md:border-e md:pe-6">
                        <p className="text-end text-sm">Trusted by magical institutions</p>
                    </div>
                    <div className="relative py-6 md:w-[calc(100%-11rem)]">
                        <InfiniteSlider
                            speedOnHover={20}
                            speed={40}
                            gap={112}>
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Ministry of Magic
                                </span>
                            </div>

                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Diagon Alley
                                </span>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Gringotts Bank
                                </span>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    St. Mungo&apos;s Hospital
                                </span>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Quidditch League
                                </span>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Ollivanders
                                </span>
                            </div>
                            
                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Daily Prophet
                                </span>
                            </div>

                            <div className="flex items-center">
                                <span className="mx-auto text-lg font-bold text-black dark:text-white">
                                    Beauxbatons Academy
                                </span>
                            </div>
                        </InfiniteSlider>

                        <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                        <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                        <ProgressiveBlur
                            className="pointer-events-none absolute left-0 top-0 h-full w-20"
                            direction="left"
                            blurIntensity={1}
                        />
                        <ProgressiveBlur
                            className="pointer-events-none absolute right-0 top-0 h-full w-20"
                            direction="right"
                            blurIntensity={1}
                        />
                    </div>
                </div>
        </section>
    )
}
