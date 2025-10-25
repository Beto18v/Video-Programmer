import { cn } from '@/lib/utils';
import * as React from 'react';

interface TabsContextValue {
    value: string;
    onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(
    undefined,
);

const useTabs = () => {
    const context = React.useContext(TabsContext);
    if (!context) {
        throw new Error('useTabs must be used within a Tabs');
    }
    return context;
};

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
    (
        { className, defaultValue, value, onValueChange, children, ...props },
        ref,
    ) => {
        const [internalValue, setInternalValue] = React.useState(
            defaultValue || '',
        );

        const currentValue = value ?? internalValue;
        const handleValueChange = React.useCallback(
            (newValue: string) => {
                if (value === undefined) {
                    setInternalValue(newValue);
                }
                onValueChange?.(newValue);
            },
            [value, onValueChange],
        );

        return (
            <TabsContext.Provider
                value={{
                    value: currentValue,
                    onValueChange: handleValueChange,
                }}
            >
                <div ref={ref} className={cn('w-full', className)} {...props}>
                    {children}
                </div>
            </TabsContext.Provider>
        );
    },
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            className,
        )}
        {...props}
    />
));
TabsList.displayName = 'TabsList';

interface TabsTriggerProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
    ({ className, value, children, ...props }, ref) => {
        const { value: currentValue, onValueChange } = useTabs();
        const isActive = currentValue === value;

        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
                    isActive
                        ? 'bg-background text-foreground shadow-sm'
                        : 'hover:bg-background/50',
                    className,
                )}
                onClick={() => onValueChange(value)}
                {...props}
            >
                {children}
            </button>
        );
    },
);
TabsTrigger.displayName = 'TabsTrigger';

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
    value: string;
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
    ({ className, value, children, ...props }, ref) => {
        const { value: currentValue } = useTabs();

        if (currentValue !== value) {
            return null;
        }

        return (
            <div
                ref={ref}
                className={cn(
                    'mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                    className,
                )}
                {...props}
            >
                {children}
            </div>
        );
    },
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsContent, TabsList, TabsTrigger };
