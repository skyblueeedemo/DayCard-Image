; NSIS custom uninstall script
; 卸载时删除用户数据目录，避免 API Key 等残留

!macro customUnInstall
  ; 删除用户数据目录 (app.getPath('userData'))
  RMDir /r "$APPDATA\daycard-image"
  ; 删除壁纸归档目录
  RMDir /r "$DOCUMENTS\..\Pictures\DayCard-Image"
  ; 删除 Electron 缓存
  RMDir /r "$LOCALAPPDATA\daycard-image"

  ; 提示用户
  MessageBox MB_OK "已清理用户数据：API Key、图像记录、壁纸文件。" /SD IDOK
!macroend
