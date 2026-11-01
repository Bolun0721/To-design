; Custom shortcuts for the local-only Electron shell.
; Pass --no-sandbox so Windows machines that reject the Chromium sandbox still start.

!macro customInit
  ; Force-close a previous app or uninstaller before overwriting files.
  nsExec::Exec 'taskkill /F /IM FrontPageLab.exe /T'
  nsExec::Exec 'taskkill /F /IM "Uninstall FrontPageLab.exe" /T'
  nsExec::Exec 'taskkill /F /IM "头版智造局.exe" /T'
  Sleep 800
!macroend

!macro customInstall
  SetShellVarContext current
  CreateShortCut "$DESKTOP\头版智造局.lnk" "$INSTDIR\FrontPageLab.exe" "--no-sandbox" "$INSTDIR\FrontPageLab.exe" 0 "" "" "启动 头版智造局"
  CreateShortCut "$SMPROGRAMS\头版智造局.lnk" "$INSTDIR\FrontPageLab.exe" "--no-sandbox" "$INSTDIR\FrontPageLab.exe" 0 "" "" "启动 头版智造局"
  CreateShortCut "$INSTDIR\启动头版智造局.lnk" "$INSTDIR\FrontPageLab.exe" "--no-sandbox" "$INSTDIR\FrontPageLab.exe" 0 "" "" "启动 头版智造局"
!macroend

!macro customUnInstall
  Delete "$DESKTOP\头版智造局.lnk"
  Delete "$SMPROGRAMS\头版智造局.lnk"
!macroend
