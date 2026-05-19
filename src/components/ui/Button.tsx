import { forwardRef } from 'react'
import { cn } from '@/lib/utils/formatters'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            children,
            variant = 'primary',
            size = 'md',
            fullWidth = false,
            isLoading = false,
            className,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = cn(
            'relative inline-flex items-center justify-center font-medium transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-connect focus-visible:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
            fullWidth && 'w-full'
        )

        const variants = {
            primary: 'bg-sky-connect text-pure-white hover:bg-sky-connect/90 shadow-subtle',
            secondary: 'bg-pure-white text-charcoal-tone hover:bg-cloud-whisper border border-pale-ash',
            ghost: 'bg-transparent text-inkwell-gray hover:bg-cloud-whisper',
            outline: 'bg-transparent border border-sky-connect text-sky-connect hover:bg-sky-connect/5',
            danger: 'bg-red-600 text-pure-white hover:bg-red-700 shadow-subtle',
        }

        const sizes = {
            sm: 'px-3 py-1.5 text-xs rounded-md min-h-[32px]',
            md: 'px-4 py-2 text-sm rounded-md min-h-[40px]',
            lg: 'px-6 py-3 text-base rounded-md min-h-[48px]',
        }

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={disabled || isLoading}
                aria-busy={isLoading}
                {...props}
            >
                {/* Absolute centered spinner preserves container dimensions */}
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                            className="animate-spin h-5 w-5 text-current"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                    </div>
                )}

                {/* Text goes invisible but preserves natural layout width when loading */}
                <span className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
                    {children}
                </span>
            </button>
        )
    }
)

Button.displayName = 'Button'