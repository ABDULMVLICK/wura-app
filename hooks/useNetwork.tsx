// `NetInfo` a été désactivé temporairement car sa compilation native 
// échoue sur ton Xcode actuel (NativeModule.RNCNetInfo is null).
// Le Hook simule un appareil toujours connecté pour que tu puisses tester le reste de l'appli.

import { useState } from 'react';

export function useNetwork() {
    const [isConnected] = useState<boolean | null>(true);
    return { isConnected };
}
