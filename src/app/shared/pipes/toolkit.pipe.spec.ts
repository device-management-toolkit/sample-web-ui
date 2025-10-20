import { TestBed } from '@angular/core/testing'
import { FormOption } from 'src/models/models'
import { ToolkitPipe } from './toolkit.pipe'
import { TranslateModule } from '@ngx-translate/core'

describe('ToolkitPipe', () => {
  let pipe: ToolkitPipe

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [ToolkitPipe]
    })
    pipe = TestBed.inject(ToolkitPipe)
  })

  it('create an instance', () => {
    expect(pipe).toBeTruthy()
  })

  it('should return the correct label when value matches', () => {
    const options: FormOption<number | boolean | string>[] = [
      { value: 1, label: 'Option 1' },
      { value: 2, label: 'Option 2' }
    ]
    expect(pipe.transform(1, options)).toBe('Option 1')
  })

  it('should return null when no value matches', () => {
    const options: FormOption<number | boolean | string>[] = [
      { value: 1, label: 'Option 1' },
      { value: 2, label: 'Option 2' }
    ]
    expect(pipe.transform(3, options)).toBeNull()
  })

  it('should handle empty options array', () => {
    const options: FormOption<number | boolean | string>[] = []
    expect(pipe.transform(1, options)).toBeNull()
  })

  it('should handle non-number values in options', () => {
    const options: FormOption<number | boolean | string>[] = [
      { value: 'test', label: 'Option Test' },
      { value: true, label: 'Option True' }
    ]
    expect(pipe.transform('test' as unknown as number, options)).toBe('Option Test')
  })
})
