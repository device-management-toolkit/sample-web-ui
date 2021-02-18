import { browser, by, element } from 'protractor'

export class AppPage {
  async navigateTo (): Promise<unknown> {
    return await browser.get(browser.baseUrl)
  }

  async getTitleText (): Promise<string> {
    return await element(by.css('app-root .content span')).getText()
  }
}
